import { useForm } from 'react-hook-form';
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
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { Input } from '../ui/input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1),
});

type Schema = z.infer<typeof schema>;

async function createProgram(data: Schema) {
  const res = await api.program.$post({ json: data });
  if (!res.ok) {
    throw new Error('server error');
  }
}

export default function AddProgramDialog() {
  const form = useForm<Schema>({ resolver: zodResolver(schema) });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate } = useMutation({ mutationFn: createProgram });

  const onSubmit = (data: Schema) => {
    mutate(data, {
      onSuccess: () => {
        toast.success('Program created successfully');
        queryClient.invalidateQueries({ queryKey: ['programs'] });
        setOpen(false);
        form.reset();
      },
      onError: (error) => {
        console.log('PROGRAMS ERROR:', error);
        toast.error('Failed to create program');
      },
    });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>Add Program</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Program</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
              <Button type='submit'>Submit</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
