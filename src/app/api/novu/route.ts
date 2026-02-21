import { serve } from '@novu/framework/next';
import { allWorkflows } from '@/lib/novu-workflows';

export const dynamic = 'force-dynamic';

export const { GET, POST, OPTIONS } = serve({ workflows: allWorkflows });
