import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { useState } from 'react';
import { Textarea } from '../ui/textarea';
import { createGlobalNotification } from '@/lib/api';
import { toast } from 'sonner';

const schema = z.object({
  message: z.string().min(1),
});

type Schema = z.infer<typeof schema>;

export default function AddNotificationDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<Schema>({ resolver: zodResolver(schema) });

  const createGlobalNotificationMutation = useMutation({
    mutationFn: createGlobalNotification,
  });

  const onSubmit = (data: Schema) => {
    createGlobalNotificationMutation.mutate(data, {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='icon'>
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Notification</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='message'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className='justify-end pt-4'>
              <DialogClose asChild>
                <Button type='button' variant='outline'>
                  Close
                </Button>
              </DialogClose>
              <Button>Submit</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
