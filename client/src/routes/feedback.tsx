import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  verifySupervisorAccessCode,
  getSupervisorFeedbackTemplates,
  supervisorFeedbackResponse,
} from '@/lib/api';
import BSULogo from '@/assets/bsu-logo.png';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

interface VerifyCodeResponse {
  valid: boolean;
  ojtId: number;
  templateId: number;
  message?: string;
}

type FeedbackSearch = {
  code: string;
};

type Question = {
  id: number;
  question: string;
};

export const Route = createFileRoute('/feedback')({
  component: RouteComponent,
  validateSearch: (search: Record<string, string>): FeedbackSearch => {
    return {
      code: search.code,
    };
  },
});

const codeSchema = z.object({
  code: z.string().min(1, 'Access code is required'),
});

type CodeFormValues = z.infer<typeof codeSchema>;

type OJTData = {
  ojtId: number;
  templateId: number;
  company: {
    name: string;
  };
  class: {
    name: string;
  };
  program: {
    name: string;
  };
  department: {
    name: string;
  };
  supervisorName: string;
  studentName: string;
  feedbackSubmitted: boolean;
};

function RouteComponent() {
  const search = Route.useSearch();
  const [accessCodeVerified, setAccessCodeVerified] = useState(false);
  const [ojtId, setOjtId] = useState<number | null>(null);
  const [ojtData, setOJTData] = useState<OJTData | null>(null);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);

  const codeForm = useForm<CodeFormValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      code: search.code || '',
    },
  });

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['supervisor-feedback-templates'],
    queryFn: getSupervisorFeedbackTemplates,
    staleTime: 0,
  });

  const { mutate: verifyCode, isPending: isVerifying } = useMutation({
    mutationFn: (data: { code: string }) =>
      verifySupervisorAccessCode(data.code),
    onSuccess: (data: VerifyCodeResponse) => {
      if (data.valid) {
        setAccessCodeVerified(true);
        setOjtId(data.ojtId);
        setOJTData(data as unknown as OJTData);
        toast.success('Access code verified');
      } else {
        toast.error(data.message || 'Invalid access code');
      }
    },
    onError: () => {
      toast.error('Failed to verify access code');
    },
  });

  const onCodeSubmit = (data: CodeFormValues) => {
    verifyCode({ code: data.code });
  };

  // Dynamically generate schema based on template questions
  const generateFormSchema = () => {
    const feedbackSchema = z.record(
      z.string(),
      z.string().min(1, 'Please select an option'),
    );

    // If there's an existing response, we don't require a new signature
    return z.object({
      otherCommentsAndSuggestions: z.string().optional(),
      feedback: feedbackSchema,
      signature: z.instanceof(File),
    });
  };

  const formSchema = generateFormSchema();
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otherCommentsAndSuggestions: '',
      feedback: {},
    },
  });

  const { mutate: submitFeedback, isPending } = useMutation({
    mutationFn: supervisorFeedbackResponse,
  });

  const onSubmit = (data: FormValues) => {
    try {
      if (template?.questions?.length) {
        const unansweredQuestions = template.questions.filter(
          (question) => !data.feedback?.[question.id],
        );

        if (unansweredQuestions.length > 0) {
          toast.error(
            `Please answer all questions before submitting. You have ${unansweredQuestions.length} unanswered questions.`,
          );
          return;
        }
      }

      // Ensure signature is uploaded
      if (!data.signature) {
        toast.error('Please upload your signature before submitting.');
        return;
      }

      // Ensure feedback is not an empty object
      if (Object.keys(data.feedback || {}).length === 0) {
        toast.error('Please answer at least one feedback question.');
        return;
      }

      if (!ojtId) {
        toast.error('OJT ID not found');
        return;
      }

      submitFeedback(
        {
          templateId: template!.id,
          ojtId,
          ...data,
        },
        {
          onSuccess: () => {
            toast.success('Feedback submitted successfully!');
          },
          onError: (error) => {
            console.error('Submission error:', error);
            toast.error(
              `Error submitting feedback: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          },
        },
      );
      setHasSubmittedFeedback(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(
        'There was an error submitting your feedback. Please try again.',
      );
    }
  };

  const signature = form.watch('signature');

  if (!accessCodeVerified) {
    return (
      <div className='flex items-center justify-center min-h-screen p-4 bg-gray-50'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Supervisor Feedback</CardTitle>
            <CardDescription>
              Please enter the access code you received via email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...codeForm}>
              <form onSubmit={codeForm.handleSubmit(onCodeSubmit)}>
                <FormField
                  control={codeForm.control}
                  name='code'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder='Enter your access code'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type='submit'
                  className='w-full mt-4'
                  disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Verifying...
                    </>
                  ) : (
                    'Verify Access Code'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (templateLoading || !template) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin' />
      </div>
    );
  }

  if (ojtData?.feedbackSubmitted || hasSubmittedFeedback) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Feedback Already Submitted</CardTitle>
            <CardDescription>
              Thank you for submitting your feedback.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className='container py-8 mx-auto'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-4'>
          <div className='border border-black form-container'>
            {/* Header with logo and reference information */}
            <table className='w-full border-collapse'>
              <tbody>
                <tr>
                  <td className='p-2 w-1/6'>
                    <div className='flex justify-center'>
                      <img
                        src={BSULogo}
                        alt='BSU Logo'
                        className='w-14 h-14 border border-black rounded-full'
                      />
                    </div>
                  </td>
                  <td className='border-l border-black p-2 text-center'>
                    <span className='text-sm'>
                      Reference No.: BatStateU-FO-OJT-04
                    </span>
                  </td>
                  <td className='border-l border-black p-2 text-center'>
                    <span className='text-sm'>
                      Effectivity Date: May 18, 2022
                    </span>
                  </td>
                  <td className='border-l border-black p-2 text-center'>
                    <span className='text-sm'>Revision No.: 01</span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Form Title */}
            <div className='text-center font-bold border-t border-black py-2'>
              TRAINING SUPERVISOR&apos;S FEEDBACK FORM
            </div>

            {/* Student Information */}
            <table className='w-full border-collapse'>
              <tbody>
                <tr>
                  <td className='border-t border-black p-2 w-1/2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>
                        Name of the Training-Supervisor:
                      </Label>
                      {ojtData?.supervisorName}
                    </div>
                  </td>
                  <td className='border-t border-l border-black p-2 w-1/2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>Department:</Label>
                      {ojtData?.department?.name}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className='border-t border-black p-2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>Name of Company:</Label>
                      {ojtData?.company?.name}
                    </div>
                  </td>
                  <td className='border-t border-l border-black p-2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>Date of Monitoring:</Label>
                      {format(new Date(), 'MMMM d, yyyy')}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className='border-t border-black p-2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>
                        Name of the Student-Trainee:
                      </Label>
                      {ojtData?.studentName}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Feedback Criteria Table */}
            <table className='w-full border-collapse'>
              <thead>
                <tr>
                  <th className='border-t border-black p-2 text-sm text-left'>
                    Criteria:
                  </th>
                  <th className='border-t border-l border-black p-2 text-center w-12'>
                    SA
                  </th>
                  <th className='border-t border-l border-black p-2 text-center w-12'>
                    A
                  </th>
                  <th className='border-t border-l border-black p-2 text-center w-12'>
                    N
                  </th>
                  <th className='border-t border-l border-black p-2 text-center w-12'>
                    D
                  </th>
                  <th className='border-t border-l border-black p-2 text-center w-12'>
                    SD
                  </th>
                </tr>
              </thead>
              <tbody>
                {template?.questions?.map((question: Question) => (
                  <tr key={question.id}>
                    <td className='border-t border-black p-2 text-sm'>
                      {question.question}
                      {form.formState.errors.feedback &&
                        (form.formState.errors.feedback as Record<string, any>)[
                          question.id.toString()
                        ] && (
                          <p className='text-red-500 text-xs mt-1'>
                            Please select an option
                          </p>
                        )}
                    </td>
                    <FormField
                      control={form.control}
                      name={`feedback.${question.id}`}
                      render={({ field }) => (
                        <>
                          <td className='border-t border-l border-black text-center'>
                            <FormControl>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={field.value === 'SA'}
                                onChange={() => field.onChange('SA')}
                                // disabled={hasExistingResponse}
                              />
                            </FormControl>
                          </td>
                          <td className='border-t border-l border-black text-center'>
                            <FormControl>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={field.value === 'A'}
                                onChange={() => field.onChange('A')}
                                // disabled={hasExistingResponse}
                              />
                            </FormControl>
                          </td>
                          <td className='border-t border-l border-black text-center'>
                            <FormControl>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={field.value === 'N'}
                                onChange={() => field.onChange('N')}
                                // disabled={hasExistingResponse}
                              />
                            </FormControl>
                          </td>
                          <td className='border-t border-l border-black text-center'>
                            <FormControl>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={field.value === 'D'}
                                onChange={() => field.onChange('D')}
                                // disabled={hasExistingResponse}
                              />
                            </FormControl>
                          </td>
                          <td className='border-t border-l border-black text-center'>
                            <FormControl>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={field.value === 'SD'}
                                onChange={() => field.onChange('SD')}
                                // disabled={hasExistingResponse}
                              />
                            </FormControl>
                          </td>
                        </>
                      )}
                    />
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Problems Met */}
            <table className='w-full border-collapse'>
              <tbody>
                <tr>
                  <td className='border-t border-black p-2'>
                    <FormField
                      control={form.control}
                      name='otherCommentsAndSuggestions'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-bold'>
                            Other Comments and Suggestions:
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className='border-t border-black rounded-none resize-none h-24 w-full mt-1 p-0 bg-transparent feedback-textarea'
                              // disabled={hasExistingResponse}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Privacy Notice */}
            <table className='w-full border-collapse'>
              <tbody>
                <tr>
                  <td className='border-t border-black p-2'>
                    <div className='text-sm privacy-text'>
                      <p>
                        Pursuant to Republic Act No. 10173, also known as the
                        Data Privacy Act of 2012, the Batangas State University,
                        the National Engineering University recognizes its
                        commitment to protect and respect the privacy of its
                        customers and/or stakeholders and ensure that all
                        information collected from them are all processed in
                        accordance with the principles of transparency,
                        legitimate purpose and proportionality mandated under
                        the Data Privacy Act of 2012.
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Signature */}
            <table className='w-full border-collapse'>
              <tbody>
                <tr>
                  <td className='border-t border-black p-2'>
                    <div className='flex flex-col items-center signature-section'>
                      {/* {hasExistingResponse && existingSignatureUrl ? (
                        // Display existing signature
                        <div className='flex flex-col items-center gap-2'>
                          <img
                            src={existingSignatureUrl}
                            alt='Signature'
                            className='h-24 object-cover'
                          />
                        </div>
                      ) : ( */}
                      <FormField
                        control={form.control}
                        name='signature'
                        render={({
                          field: { value, onChange, ...fieldProps },
                        }) => (
                          <FormItem>
                            <FormControl>
                              <div className='flex flex-col items-center gap-2'>
                                {signature && (
                                  <img
                                    src={URL.createObjectURL(signature)}
                                    alt='Signature'
                                    className='h-24 object-cover'
                                  />
                                )}
                                <Input
                                  {...fieldProps}
                                  className='hide-file-input'
                                  type='file'
                                  accept='image/*'
                                  onChange={(e) =>
                                    onChange(
                                      e.target.files && e.target.files[0],
                                    )
                                  }
                                  // disabled={hasExistingResponse}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      {/* )} */}
                      <div className='text-center pt-1'>
                        <p>{ojtData?.supervisorName}</p>
                        <div className='border-t border-black mt-1 w-64 pt-1'>
                          <div className='text-sm'>
                            Signature over Printed Name of
                          </div>
                          <div className='text-sm'>Training Supervisor</div>
                          <div className='text-sm mt-2'>
                            Date: {format(new Date(), 'MMMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Legend */}
            <table className='w-full border-collapse'>
              <tbody>
                <tr>
                  <td className='border-t border-black p-2'>
                    <div className='text-sm'>
                      <div className='font-bold'>Legend:</div>
                      <div className='flex flex-wrap justify-between'>
                        <span className='mr-4'>SA - Strongly Agree</span>
                        <span className='mr-4'>A - Agree</span>
                        <span className='mr-4'>
                          N - Neither agree or disagree
                        </span>
                        <span className='mr-4'>D - Disagree</span>
                        <span>SD - Strongly Disagree</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className='flex justify-end'>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
