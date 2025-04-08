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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { api, getDepartments, getPrograms } from '@/lib/api';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const schema = z.object({
  name: z.string().min(1),
  programId: z.coerce.number(),
  departmentId: z.coerce.number(),
});

type Schema = z.infer<typeof schema>;

async function createClass(data: Schema) {
  const res = await api.class.$post({ json: data });
  if (!res.ok) {
    throw new Error('server error');
  }
}

export default function AddClassDialog() {
  const form = useForm<Schema>({ resolver: zodResolver(schema) });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { isPending: departmentsPending, data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    enabled: open,
  });
  const { isPending: programsPending, data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: getPrograms,
    enabled: open,
  });

  const isPending = useMemo(
    () => departmentsPending || programsPending,
    [departmentsPending, programsPending],
  );

  const { mutate } = useMutation({ mutationFn: createClass });

  const onSubmit = (data: Schema) => {
    mutate(data, {
      onSuccess: () => {
        toast.success('Class created successfully');
        queryClient.invalidateQueries({ queryKey: ['classes'] });
        setOpen(false);
        form.reset();
      },
      onError: (error) => {
        console.log('CLASS ERROR:', error);
        toast.error('Failed to create class');
      },
    });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>Add Class</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Class</DialogTitle>
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
            <FormField
              control={form.control}
              name='programId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger disabled={isPending}>
                        <SelectValue placeholder='Select a program' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!isPending &&
                        programs &&
                        programs?.map((program) => (
                          <SelectItem
                            key={program.id}
                            value={program.id.toString()}>
                            {program.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='departmentId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger disabled={isPending}>
                        <SelectValue placeholder='Select a department' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!isPending &&
                        departments &&
                        departments.map((department) => (
                          <SelectItem
                            key={department.id}
                            value={department.id.toString()}>
                            {department.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
