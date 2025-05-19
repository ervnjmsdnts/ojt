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
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Copy, Shuffle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { generatePassword, toUpperCase } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const schema = z.object({
  srCode: z.string().min(1),
  password: z.string().min(1),
  email: z.string().email().min(1),
  fullName: z.string().min(1),
  gender: z.enum(['male', 'female']),
  role: z.enum(['student', 'coordinator', 'admin']),
});

type Schema = z.infer<typeof schema>;

async function createUser(data: Schema) {
  const res = await api.user.$post({ json: data });
  if (!res.ok) {
    throw new Error('server error');
  }
}

export default function AddUserDialog() {
  const form = useForm<Schema>({ resolver: zodResolver(schema) });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate: createUserMutate } = useMutation({ mutationFn: createUser });

  const onAutoGeneratePassword = () => {
    form.setValue('password', generatePassword());
  };

  const onCopy = async () => {
    const password = form.getValues('password');
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      toast.success('Password copied to clipboard');
    } catch (error) {
      console.error('Failed to copy password:', error);
    }
  };

  const onSubmit = (data: Schema) => {
    const handleSuccess = () => {
      toast.success(`${toUpperCase(data.role)} created successfully`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      form.reset();
    };
    const handleError = () => {
      toast.error(`Failed to create ${toUpperCase(data.role)}`);
      setOpen(false);
    };

    createUserMutate(data, {
      onSuccess: () => handleSuccess(),
      onError: (error) => {
        console.log('USER ERROR:', error);
        handleError();
      },
    });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>Add User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='srCode'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type='email' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className='flex items-center gap-2'>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <Tooltip>
                      <TooltipTrigger type='button' asChild>
                        <Button
                          variant='secondary'
                          size='icon'
                          onClick={onCopy}>
                          <Copy />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger type='button' asChild>
                        <Button
                          variant='secondary'
                          size='icon'
                          onClick={onAutoGeneratePassword}>
                          <Shuffle />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Auto-generate password</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='fullName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='gender'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a gender' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='male'>Male</SelectItem>
                      <SelectItem value='female'>Female</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a role' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='coordinator'>Coordinator</SelectItem>
                      <SelectItem value='admin'>Admin</SelectItem>
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
