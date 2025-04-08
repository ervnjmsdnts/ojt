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
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, getClasses, userQueryOptions } from '@/lib/api';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ParsedFormValue } from 'hono/types';

export const Route = createFileRoute('/register')({
  beforeLoad: async ({ context }) => {
    const queryClient = context.queryClient;
    try {
      const data = await queryClient.fetchQuery(userQueryOptions);
      return { user: data };
    } catch (error) {
      return { user: null };
    }
  },
  component: RouteComponent,
});

const schema = z.object({
  srCode: z.string().min(1),
  email: z.string().email().min(1),
  classId: z.coerce.number(),
  registrationForm: z.instanceof(File),
  password: z.string().min(1),
  fullName: z.string().min(1),
  gender: z.enum(['male', 'female']),
});

type Schema = z.infer<typeof schema>;

async function register(data: Schema) {
  const res = await api.auth.register.$post({
    form: {
      srCode: data.srCode,
      email: data.email,
      classId: data.classId as unknown as ParsedFormValue,
      password: data.password,
      fullName: data.fullName,
      gender: data.gender,
      registrationForm: data.registrationForm,
    },
  });
  if (!res.ok) {
    throw new Error('server error');
  }
}

function RouteComponent() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  if (user) {
    return navigate({ to: '/dashboard' });
  }

  const { isPending, data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: getClasses,
  });

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
  });

  const { mutate } = useMutation({ mutationFn: register });

  const onSubmit = async (data: Schema) => {
    mutate(data, { onSuccess: () => navigate({ to: '/' }) });
  };

  return (
    <div className='grid place-items-center p-2 h-screen'>
      <Card className='max-w-md w-full'>
        <CardHeader>
          <CardTitle className='text-xl'>Register</CardTitle>
          <CardDescription>Enter your information</CardDescription>
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
                name='fullName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
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
                name='classId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger disabled={isPending}>
                          <SelectValue placeholder='Select a class' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!isPending &&
                          classes &&
                          classes.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='registrationForm'
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Registration Form</FormLabel>
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
            </CardContent>
            <CardFooter className='w-full flex-col'>
              <Button className='w-full'>Register</Button>
              <p className='text-sm pt-2'>
                Already have an account?{' '}
                <Button
                  variant='link'
                  type='button'
                  className='p-0'
                  onClick={() => navigate({ to: '/' })}>
                  Log in
                </Button>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
