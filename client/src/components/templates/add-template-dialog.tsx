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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';

const schema = z.object({
  file: z.instanceof(File).optional(),
  title: z.string().min(1),
  category: z.enum(['pre-ojt', 'ojt', 'post-ojt']),
  isEmailToSupervisor: z.boolean().optional().default(false),
  canStudentView: z.boolean().optional().default(true),
});

type Schema = z.infer<typeof schema>;

async function createTemplate(data: Schema) {
  const res = await api.template.$post({
    form: {
      ...data,
      canStudentView: String(data.canStudentView),
      isEmailToSupervisor: String(data.isEmailToSupervisor),
    },
  });
  if (!res.ok) {
    throw new Error('server error');
  }
}

export default function AddTemplateDialog() {
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      isEmailToSupervisor: false,
      canStudentView: true,
    },
  });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate } = useMutation({ mutationFn: createTemplate });

  const onSubmit = (data: Schema) => {
    mutate(data, {
      onSuccess: () => {
        toast.success('Template created successfully');
        queryClient.invalidateQueries({ queryKey: ['templates'] });
        setOpen(false);
        form.reset();
      },
      onError: (error) => {
        console.log('TEMPLATE ERROR:', error);
        toast.error('Failed to create template');
      },
    });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>Add Requirement</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Requirement</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-2'>
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
              name='file'
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      type='file'
                      onChange={(e) =>
                        onChange(e.target.files && e.target.files[0])
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {/* <div className='flex gap-2'> */}
            <FormField
              control={form.control}
              name='isEmailToSupervisor'
              render={({ field }) => (
                <FormItem className='flex items-center space-y-0 space-x-3'>
                  <FormControl className=''>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className='leading-0'>
                    Email to Supervisor
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='canStudentView'
              render={({ field }) => (
                <FormItem className='flex items-center space-y-0 space-x-3'>
                  <FormControl className=''>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className='leading-0'>Student can view</FormLabel>
                </FormItem>
              )}
            />
            {/* </div> */}
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
