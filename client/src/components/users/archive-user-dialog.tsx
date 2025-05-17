import { useState } from 'react';
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
import { Button } from '../ui/button';
import { Archive } from 'lucide-react';
import { archiveUser } from '@/lib/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function ArchiveUserDialog({ id }: { id: string }) {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();

  const onArchiveUser = async () => {
    try {
      await archiveUser({ id });
      toast.success('User archived successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
    } catch (error) {
      console.log(error);
      toast.error('Failed to archive user');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant='destructive' size='icon'>
          <Archive />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive User</DialogTitle>
          <DialogDescription>
            Are you sure you want to archive this user?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='justify-end pt-4'>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Close
            </Button>
          </DialogClose>
          <Button onClick={onArchiveUser}>Yes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
