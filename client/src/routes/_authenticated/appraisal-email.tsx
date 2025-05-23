import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { createFileRoute } from '@tanstack/react-router';
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormField,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import {
  checkAppraisalEmail,
  getCurrentOJT,
  sendAppraisalEmail,
} from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/appraisal-email')({
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
    queryKey: ['appraisal-email-sent'],
    queryFn: checkAppraisalEmail,
  });

  const form = useForm<FormValues>({
    defaultValues: {
      email: studentOJT?.supervisorEmail ?? '',
    },
  });

  const { mutate: sendAppraisalEmailMutate, isPending } = useMutation({
    mutationFn: sendAppraisalEmail,
  });

  const isLoading = useMemo(
    () => studentOJTLoading || emailSentLoading,
    [studentOJTLoading, emailSentLoading],
  );

  const onSubmit = (data: FormValues) => {
    sendAppraisalEmailMutate(data, {
      onSuccess: () => {
        form.reset();
        toast.success('Appraisal email sent successfully');
        queryClient.invalidateQueries({ queryKey: ['appraisal-email-sent'] });
      },
      onError: () => {
        toast.error('Failed to send appraisal email');
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
          <AlertTitle>Appraisal email already sent</AlertTitle>
          <AlertDescription>
            The appraisal email has already been sent to your supervisor.
          </AlertDescription>
        </Alert>
      ) : (
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Student Appraisal</CardTitle>
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
                        <Input type='email' {...field} disabled />
                      </FormControl>
                      <FormDescription>
                        Go to the profile page to update the email
                      </FormDescription>
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
