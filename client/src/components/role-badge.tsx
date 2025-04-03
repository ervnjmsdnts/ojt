import { toUpperCase } from '@/lib/utils';
import { Badge } from './ui/badge';

export default function RoleBadge({
  role,
}: {
  role: 'student' | 'coordinator' | 'admin';
}) {
  return <Badge variant={role}>{toUpperCase(role)}</Badge>;
}
