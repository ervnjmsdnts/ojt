import { View } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { getSingleOJTAdmin } from '@/lib/api';
import { useMemo, useState } from 'react';
import SubmissionsTableAdmin from './submissions-table-admin';
import { TemplateSubmission } from '@/lib/types';

export default function ViewSubmissions({ ojtId }: { ojtId: number }) {
  const [open, setOpen] = useState(false);
  const { isPending, data } = useQuery({
    queryKey: [`ojt/${ojtId}`],
    queryFn: () => getSingleOJTAdmin({ id: ojtId.toString() }),
    enabled: open,
  });

  const templatesAndSubmissions = useMemo(() => {
    if (isPending || !data) return {};

    return {
      pre: data['pre-ojt'] as TemplateSubmission[],
      ojt: data.ojt as TemplateSubmission[],
      post: data['post-ojt'] as TemplateSubmission[],
    };
  }, [isPending, data]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger type='button' asChild>
          <DialogTrigger asChild>
            <Button variant='secondary' size='icon'>
              <View />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>View Submissions</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className='w-[90vw] max-h-[80vh] max-w-none flex flex-col overflow-y-auto h-full'>
        <DialogHeader>
          <DialogTitle>Submissions</DialogTitle>
        </DialogHeader>
        <div className='flex-1 flex flex-col gap-3 justify-between'>
          <section className='flex-1 flex flex-col gap-2 min-h-0'>
            <h3 className='font-semibold'>Pre-OJT</h3>
            <div className='border rounded-lg flex-1 min-h-0 overflow-y-auto p-2'>
              <SubmissionsTableAdmin
                isPending={isPending}
                data={templatesAndSubmissions.pre}
              />
            </div>
          </section>
          <section className='flex-1 flex flex-col gap-2 min-h-0'>
            <h3 className='font-semibold'>OJT</h3>
            <div className='border rounded-lg flex-1 min-h-0 overflow-y-auto p-2'>
              <SubmissionsTableAdmin
                isPending={isPending}
                data={templatesAndSubmissions.ojt}
              />
            </div>
          </section>
          <section className='flex-1 flex flex-col gap-2 min-h-0'>
            <h3 className='font-semibold'>Post-OJT</h3>
            <div className='border rounded-lg flex-1 min-h-0 overflow-y-auto p-2'>
              <SubmissionsTableAdmin
                isPending={isPending}
                data={templatesAndSubmissions.post}
              />
            </div>
          </section>
        </div>
        <DialogFooter className='mt-auto pt-4'>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
