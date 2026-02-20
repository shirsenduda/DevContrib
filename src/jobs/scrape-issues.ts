import type { Job } from 'bullmq';
import prisma from '@/lib/db';
import { fullSync } from '@/services/github-sync';
import { getNovu } from '@/lib/novu';
import { logger } from '@/lib/logger';

export async function processScrapeJob(job: Job) {
  logger.info({ jobId: job.id }, 'Starting scrape job');

  // Create scrape log
  const scrapeLog = await prisma.scrapeLog.create({
    data: { status: 'RUNNING' },
  });

  try {
    await job.updateProgress(10);

    const result = await fullSync();

    await job.updateProgress(90);

    // Update scrape log
    await prisma.scrapeLog.update({
      where: { id: scrapeLog.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        reposScraped: result.reposProcessed,
        issuesFound: result.issuesFound,
        issuesUpdated: result.issuesUpdated,
        errors: result.errors,
      },
    });

    // Notify users about new issues matching their preferred languages
    try {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const newIssues = await prisma.issue.findMany({
        where: { createdAt: { gte: sixHoursAgo }, isOpen: true, isAssigned: false },
        select: {
          title: true,
          difficulty: true,
          repository: { select: { fullName: true, language: true } },
        },
      });

      if (newIssues.length > 0) {
        // Group issues by language (avoids N+1 user queries)
        const issuesByLang = new Map<string, typeof newIssues>();
        for (const issue of newIssues) {
          const lang = issue.repository.language || 'Other';
          if (!issuesByLang.has(lang)) issuesByLang.set(lang, []);
          issuesByLang.get(lang)!.push(issue);
        }

        const today = new Date().toISOString().split('T')[0];
        for (const [lang, issues] of issuesByLang) {
          const users = await prisma.user.findMany({
            where: { preferredLanguages: { has: lang } },
            select: { id: true },
          });

          for (const user of users) {
            try {
              await getNovu().trigger({
                workflowId: 'new-recommendations',
                to: user.id,
                transactionId: `recs-${user.id}-${today}`,
                payload: {
                  issueCount: issues.length,
                  topIssues: issues.slice(0, 3).map((i) => ({
                    title: i.title,
                    repoFullName: i.repository.fullName,
                    difficulty: i.difficulty,
                  })),
                },
              });
            } catch (e) {
              logger.error({ userId: user.id, error: e }, 'Failed to send recommendation notification');
            }
          }
        }

        logger.info({ newIssueCount: newIssues.length, languages: issuesByLang.size }, 'Sent recommendation notifications');
      }
    } catch (e) {
      logger.error({ error: e }, 'Failed to process recommendation notifications');
    }

    await job.updateProgress(100);

    logger.info(
      {
        jobId: job.id,
        reposScraped: result.reposProcessed,
        issuesFound: result.issuesFound,
        issuesUpdated: result.issuesUpdated,
        errors: result.errors.length,
      },
      'Scrape job completed',
    );

    return result;
  } catch (error) {
    await prisma.scrapeLog.update({
      where: { id: scrapeLog.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errors: [String(error)],
      },
    });

    logger.error({ jobId: job.id, error }, 'Scrape job failed');
    throw error;
  }
}
