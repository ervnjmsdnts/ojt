import { createFileRoute } from '@tanstack/react-router';
import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '../lib/api';

const formSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormSchema = z.infer<typeof formSchema>;

type TokenSearch = {
  token: string;
};

export const Route = createFileRoute('/reset-password')({
  component: RouteComponent,
  validateSearch: (search: Record<string, string>): TokenSearch => {
    return {
      token: search.token,
    };
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const token = search.token;

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const resetPasswordMutation = useMutation({ mutationFn: resetPassword });

  const onSubmit = async (data: FormSchema) => {
    if (!token) {
      toast.error(
        'Invalid reset token. Please request a new password reset link.',
      );
      return;
    }

    resetPasswordMutation.mutate(
      { token, newPassword: data.newPassword },
      {
        onSuccess: () => {
          toast.success('Your password has been reset successfully.');

          // Navigate to login after a short delay
          setTimeout(() => {
            navigate({ to: '/login' });
          }, 3000);
        },
        onError: () => {
          toast.error('Failed to reset password. The link may have expired.');
        },
      },
    );
  };

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='w-full max-w-md'>
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => navigate({ to: '/login' })}>
                <ArrowLeft className='h-4 w-4' />
              </Button>
              <CardTitle>Reset Password</CardTitle>
            </div>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent>
                <p className='text-sm text-gray-500 mb-4'>
                  Please enter your new password below.
                </p>
                <FormField
                  control={form.control}
                  name='newPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type='password'
                          placeholder='Enter new password'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type='password'
                          placeholder='Confirm new password'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className='w-full flex-col'>
                <Button className='w-full' type='submit'>
                  Reset Password
                </Button>
                <p className='text-sm pt-2'>
                  Remember your password?{' '}
                  <Button
                    variant='link'
                    type='button'
                    className='p-0'
                    onClick={() => navigate({ to: '/login' })}>
                    Back to login
                  </Button>
                </p>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
