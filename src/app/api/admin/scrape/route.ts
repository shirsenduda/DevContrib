import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, requireAuth, handleApiError } from '@/lib/api-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import prisma from '@/lib/db';
import { fullSync } from '@/services/github-sync';
import { getNovu } from '@/lib/novu';
import { logger } from '@/lib/logger';

const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || '').split(',').filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, { maxRequests: 5, windowMs: 60_000 });
    if (rateLimited) return rateLimited;

    const user = await requireAuth();

    // Check admin access — deny by default if no admins configured
    if (ADMIN_USERNAMES.length === 0 || !ADMIN_USERNAMES.includes(user.username)) {
      return createErrorResponse('Admin access required', 403);
    }

    // Create scrape log
    const scrapeLog = await prisma.scrapeLog.create({
      data: { status: 'RUNNING' },
    });

    try {
      // Run fullSync directly — no BullMQ needed
      const result = await fullSync();

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

            for (const u of users) {
              try {
                await getNovu().trigger({
                  workflowId: 'new-recommendations',
                  to: u.id,
                  transactionId: `recs-${u.id}-${today}`,
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
                logger.error({ userId: u.id, error: e }, 'Failed to send recommendation notification');
              }
            }
          }
        }
      } catch (e) {
        logger.error({ error: e }, 'Failed to process recommendation notifications');
      }

      logger.info(
        {
          triggeredBy: user.username,
          reposScraped: result.reposProcessed,
          issuesFound: result.issuesFound,
          issuesUpdated: result.issuesUpdated,
          errors: result.errors.length,
        },
        'Manual scrape completed',
      );

      return createApiResponse({
        message: 'Scrape completed successfully',
        reposScraped: result.reposProcessed,
        issuesFound: result.issuesFound,
        issuesUpdated: result.issuesUpdated,
        errors: result.errors.length,
      });
    } catch (error) {
      await prisma.scrapeLog.update({
        where: { id: scrapeLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errors: [String(error)],
        },
      });
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
