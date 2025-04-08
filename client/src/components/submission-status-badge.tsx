import { toUpperCase } from '@/lib/utils';
import { Badge } from './ui/badge';

export default function SubmissionStatusBadge({
  status,
}: {
  status: 'pending' | 'approved' | 'resubmit';
}) {
  return <Badge variant={status}>{toUpperCase(status)}</Badge>;
}
