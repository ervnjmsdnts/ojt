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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '@/lib/api';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  title: z.string().min(1),
  category: z.enum(['pre-ojt', 'ojt', 'post-ojt']),
  formId: z.string().min(1),
  formUrl: z.string().min(1),
});

type Schema = z.infer<typeof schema>;

async function createForm(data: Schema) {
  const res = await api.template.form.$post({ json: data });
  if (!res.ok) {
    throw new Error('server error');
  }
}

export default function AddFormDialog() {
  const form = useForm<Schema>({ resolver: zodResolver(schema) });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate } = useMutation({ mutationFn: createForm });

  const onSubmit = (data: Schema) => {
    mutate(data, {
      onSuccess: () => {
        toast.success('Form created successfully');
        queryClient.invalidateQueries({ queryKey: ['templates'] });
        setOpen(false);
        form.reset();
      },
      onError: (error) => {
        console.log('FORM ERROR:', error);
        toast.error('Failed to create form');
      },
    });
  };
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>Add Form</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Form</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='category'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a category' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='pre-ojt'>Pre-OJT</SelectItem>
                      <SelectItem value='ojt'>OJT</SelectItem>
                      <SelectItem value='post-ojt'>Post-OJT</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='formId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Form ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='formUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Form URL</FormLabel>
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
