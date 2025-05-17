import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { api, userQueryOptions } from '@/lib/api';
import { toast } from 'sonner';
import Banner from '@/assets/banner.png';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ context }) => {
    const queryClient = context.queryClient;
    let user = null;

    try {
      user = await queryClient.fetchQuery(userQueryOptions);
    } catch (error) {
      user = null;
    }

    if (user) {
      throw redirect({ to: '/dashboard', throw: true });
    }
  },
  component: RouteComponent,
});

const loginSchema = z.object({
  srCode: z.string().min(1),
  password: z.string().min(1),
});

type Schema = z.infer<typeof loginSchema>;

async function login(data: Schema) {
  const res = await api.auth.login.$post(
    { json: data },
    { init: { credentials: 'include' } },
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message);
  }
}

function RouteComponent() {
  const navigate = useNavigate();
  const form = useForm<Schema>({ resolver: zodResolver(loginSchema) });

  const { mutate } = useMutation({ mutationFn: login });

  const onSubmit = async (data: Schema) => {
    mutate(data, {
      onSuccess: () => {
        window.location.reload();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <div className='h-screen flex flex-col'>
      <div>
        <img src={Banner} />
      </div>
      <div className='grid place-items-center flex-1'>
        <Card className='max-w-md w-full'>
          <CardHeader>
            <CardTitle className='text-xl pt-4'>Login</CardTitle>
            <CardDescription>Enter your credentials</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent>
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
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type='password' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  onClick={() => navigate({ to: '/forgot-password' })}
                  type='button'
                  variant='link'
                  className='px-0'>
                  Forgot Password
                </Button>
              </CardContent>
              <CardFooter className='w-full flex-col'>
                <Button className='w-full'>Login</Button>
                <p className='text-sm pt-2'>
                  Are you a Student Intern?{' '}
                  <Button
                    variant='link'
                    type='button'
                    className='p-0'
                    onClick={() => navigate({ to: '/register' })}>
                    Register
                  </Button>
                </p>
                <div className='border-t w-full flex items-center justify-center pt-3'>
                  <Dialog>
                    <DialogTrigger>
                      <Button variant='outline' type='button'>
                        Contact Us
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Contact Information</DialogTitle>
                        <DialogDescription>
                          For any portal concerns, please contact us through the
                          following channels:
                        </DialogDescription>
                      </DialogHeader>
                      <div className='space-y-4 mt-4'>
                        {/* <div>
                          <h4 className='font-medium mb-2'>
                            Technical Support
                          </h4>
                          <p className='text-sm text-muted-foreground'>
                            support@ojtportal.edu
                          </p>
                          <p className='text-xs text-muted-foreground mt-1'>
                            For technical issues and portal access problems
                          </p>
                        </div>
                        <div>
                          <h4 className='font-medium mb-2'>Student Services</h4>
                          <p className='text-sm text-muted-foreground'>
                            studentservices@ojtportal.edu
                          </p>
                          <p className='text-xs text-muted-foreground mt-1'>
                            For internship-related inquiries and documentation
                          </p>
                        </div> */}
                        <div>
                          <h4 className='font-medium mb-2'>
                            General Inquiries
                          </h4>
                          <p className='text-sm text-muted-foreground'>
                            eim.ceafa@g.batstate-u.edu.ph
                          </p>
                          <p className='text-xs text-muted-foreground mt-1'>
                            For general questions and feedback
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
