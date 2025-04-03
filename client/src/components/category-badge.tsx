import { OJTCategory } from '@/lib/types';
import { Badge } from './ui/badge';
import { useMemo } from 'react';

export default function CategoryBadge({ category }: { category: OJTCategory }) {
  const text = useMemo(() => {
    switch (category) {
      case 'pre-ojt':
        return 'Pre-OJT';
      case 'ojt':
        return 'OJT';
      case 'post-ojt':
        return 'Post-OJT';
    }
  }, [category]);
  return <Badge variant={category}>{text}</Badge>;
}
