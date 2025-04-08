import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export default function DoubleClickTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className='flex items-center gap-2'>
        {text}
        <Info className='w-4 h-4' />
      </TooltipTrigger>
      <TooltipContent>Double-click on cell to update</TooltipContent>
    </Tooltip>
  );
}
