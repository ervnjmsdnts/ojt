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
import { createFileRoute, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const form = useForm();
  return (
    <div className='grid place-items-center p-2 h-screen'>
      <Card className='max-w-md w-full'>
        <CardHeader>
          <CardTitle className='text-xl'>Login</CardTitle>
          <CardDescription>Enter your credentials</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form>
            <CardContent>
              <FormField
                control={form.control}
                name='srCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SR-Code</FormLabel>
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
              <Button className='w-full' type='button' asChild>
                <Link to='/s'>Login</Link>
              </Button>
              <p className='text-sm pt-2'>
                Don&apos;t have an account?{' '}
                <Button variant='link' type='button' className='p-0'>
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
