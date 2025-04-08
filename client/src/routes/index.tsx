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

export const Route = createFileRoute('/')({
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
  component: Index,
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

function Index() {
  const navigate = useNavigate();
  const form = useForm<Schema>({ resolver: zodResolver(loginSchema) });

  const { mutate } = useMutation({ mutationFn: login });

  const onSubmit = async (data: Schema) => {
    mutate(data, {
      onSuccess: () => window.location.reload(),
      onError: (error) => {
        console.log(error.message);
      },
    });
  };

  return (
    <div className='grid place-items-center p-2 h-screen'>
      <Card className='max-w-md w-full'>
        <CardHeader>
          <CardTitle className='text-xl'>Login</CardTitle>
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
            </CardContent>
            <CardFooter className='w-full flex-col'>
              <Button className='w-full'>Login</Button>
              <p className='text-sm pt-2'>
                Don&apos;t have an account?{' '}
                <Button
                  variant='link'
                  type='button'
                  className='p-0'
                  onClick={() => navigate({ to: '/register' })}>
                  Register
                </Button>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
