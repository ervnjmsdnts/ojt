import { toUpperCase } from '@/lib/utils';
import { Badge } from './ui/badge';

export default function RequestStatusBadge({
  status,
}: {
  status: 'pending' | 'approved' | 'rejected';
}) {
  return <Badge variant={status}>{toUpperCase(status)}</Badge>;
}
