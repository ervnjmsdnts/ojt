import { Loader2, X } from 'lucide-react';
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
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rejectRequest } from '@/lib/api';
import { toast } from 'sonner';

export default function RejectDialog({ requestId }: { requestId: number }) {
  const [open, setOpen] = useState(false);
  const { isPending, mutate } = useMutation({ mutationFn: rejectRequest });
  const queryClient = useQueryClient();

  const onRejectRequest = () => {
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
            <Button variant='destructive' size='icon'>
              <X />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Reject</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Request</DialogTitle>
          <DialogDescription>
            Are you sure you want to reject the student&apos;s request?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='justify-end pt-4'>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={onRejectRequest} disabled={isPending}>
            {isPending && <Loader2 className='w-4 h-4 animate-spin mr-2' />}Sure
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
