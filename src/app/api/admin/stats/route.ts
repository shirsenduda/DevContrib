import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { createApiResponse, handleApiError } from '@/lib/api-helpers';

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalRepos,
      activeRepos,
      totalIssues,
      openIssues,
      totalUsers,
      totalContributions,
      mergedPRs,
      recentScrape,
    ] = await Promise.all([
      prisma.repository.count(),
      prisma.repository.count({ where: { isActive: true } }),
      prisma.issue.count(),
      prisma.issue.count({ where: { isOpen: true } }),
      prisma.user.count(),
      prisma.userContribution.count(),
      prisma.userContribution.count({ where: { status: 'PR_MERGED' } }),
      prisma.scrapeLog.findFirst({ orderBy: { startedAt: 'desc' } }),
    ]);

    return createApiResponse({
      totalRepos,
      activeRepos,
      totalIssues,
      openIssues,
      totalUsers,
      totalContributions,
      mergedPRs,
      recentScrape,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
