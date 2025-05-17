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

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormSchema = z.infer<typeof formSchema>;

export const Route = createFileRoute('/forgot-password')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormSchema) => {
    // TODO: Implement password reset request
    console.log(data);
  };

  return (
    <div className='min-h-screen flex items-center justify-center '>
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
              <CardTitle>Forgot Password</CardTitle>
            </div>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent>
                <p className='text-sm text-gray-500 mb-4'>
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type='email'
                          placeholder='Enter your email'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className='w-full flex-col'>
                <Button className='w-full' type='submit'>
                  Send Reset Link
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
