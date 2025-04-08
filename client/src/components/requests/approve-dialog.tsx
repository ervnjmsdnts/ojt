import { Check, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveRequest } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';

export default function ApproveDialog({ requestId }: { requestId: number }) {
  const [open, setOpen] = useState(false);
  const { isPending, mutate } = useMutation({ mutationFn: approveRequest });
  const queryClient = useQueryClient();

  const onApproveRequest = () => {
    mutate(
      { requestId },
      {
        onSuccess: (data) => {
          toast.success(data.message);
          queryClient.invalidateQueries({ queryKey: ['requests'] });
          setOpen(false);
        },
        onError: (error) => {
          console.log(error);
          toast.error('Something went wrong');
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant='success' size='icon'>
              <Check />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Approve</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Request</DialogTitle>
          <DialogDescription>
            Are you sure you want to manage the student&apos;s OJT requirements?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='justify-end pt-4'>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={onApproveRequest} disabled={isPending}>
            {isPending && <Loader2 className='w-4 h-4 animate-spin mr-2' />}Sure
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
