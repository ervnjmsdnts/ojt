import { OJTStatus } from '@/lib/types';
import { Badge } from './ui/badge';
import { useMemo } from 'react';

export default function CategoryBadge({ category }: { category: OJTStatus }) {
  const text = useMemo(() => {
    switch (category) {
      case 'pre-ojt':
        return 'Pre-OJT';
      case 'ojt':
        return 'OJT';
      case 'post-ojt':
        return 'Post-OJT';
      case 'completed':
        return 'Completed';
    }
  }, [category]);
  return <Badge variant={category}>{text}</Badge>;
}
