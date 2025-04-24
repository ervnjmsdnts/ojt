import DECE from '@/assets/dece.png';
import BSU from '@/assets/bsu-logo.png';
import { cn } from '@/lib/utils';

export default function Logo({ isLarge }: { isLarge?: boolean }) {
  return (
    <div className='flex items-center -ml-2'>
      <img src={DECE} className={cn('w-12', isLarge && 'w-16')} />
      <img src={BSU} className={cn('w-8 -ml-4', isLarge && 'w-10')} />
    </div>
  );
}
