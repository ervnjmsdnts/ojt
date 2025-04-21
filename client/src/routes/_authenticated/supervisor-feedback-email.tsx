import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { createFileRoute } from '@tanstack/react-router';
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormField,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import {
  checkSupervisorFeedbackEmail,
  getCurrentOJT,
  sendSupervisorFeedbackEmail,
} from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
export const Route = createFileRoute(
  '/_authenticated/supervisor-feedback-email',
)({
  component: RouteComponent,
});

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

function RouteComponent() {
  const { isLoading: studentOJTLoading, data: studentOJT } = useQuery({
    queryKey: ['student-ojt'],
    queryFn: getCurrentOJT,
  });

  const queryClient = useQueryClient();

  const { data: emailSent, isLoading: emailSentLoading } = useQuery({
    queryKey: ['email-sent'],
    queryFn: checkSupervisorFeedbackEmail,
  });

  const form = useForm<FormValues>({
    defaultValues: {
      email: studentOJT?.supervisorEmail ?? '',
    },
  });

  const { mutate: sendSupervisorFeedbackEmailMutate, isPending } = useMutation({
    mutationFn: sendSupervisorFeedbackEmail,
  });

  const isLoading = useMemo(
    () => studentOJTLoading || emailSentLoading,
    [studentOJTLoading, emailSentLoading],
  );

  const onSubmit = (data: FormValues) => {
    sendSupervisorFeedbackEmailMutate(data, {
      onSuccess: () => {
        form.reset();
        toast.success('Email sent successfully');
        queryClient.invalidateQueries({ queryKey: ['email-sent'] });
      },
      onError: () => {
        toast.error('Failed to send email');
      },
    });
  };

  return (
    <SidebarInset className='flex items-center justify-center'>
      {isLoading ? (
        <div className='flex items-center justify-center h-full'>
          <Loader2 className='w-4 h-4 animate-spin' />
        </div>
      ) : emailSent?.sent ? (
        <Alert variant='default' className='w-full max-w-md'>
          <AlertTitle>Email already sent</AlertTitle>
          <AlertDescription>
            The email has already been sent to your supervisor.
          </AlertDescription>
        </Alert>
      ) : (
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Supervisor Feedback</CardTitle>
            <CardDescription>
              Please enter the email of your supervisor to send the feedback
              form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supervisor Email</FormLabel>
                      <FormControl>
                        <Input type='email' {...field} disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type='submit'
                  className='w-full mt-4'
                  disabled={isPending}>
                  {isPending ? 'Sending...' : 'Send'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </SidebarInset>
  );
}
