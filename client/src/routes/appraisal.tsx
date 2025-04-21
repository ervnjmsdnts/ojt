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
  verifyAppraisalAccessCode,
  getAppraisalTemplate,
  submitAppraisalResponse,
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

type AppraisalSearch = {
  code: string;
};

type Question = {
  id: number;
  question: string;
  createdAt: number | null;
};

type Category = {
  id: number;
  name: string;
  displayOrder: number;
  createdAt: number | null;
  questions: Question[];
};

export const Route = createFileRoute('/appraisal')({
  component: RouteComponent,
  validateSearch: (search: Record<string, string>): AppraisalSearch => {
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
  semester: string;
  yearLevel: string;
  totalOJTHours: number;
  company: {
    name: string;
    address?: string;
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
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [ojtData, setOJTData] = useState<OJTData | null>(null);
  const [hasSubmittedAppraisal, setHasSubmittedAppraisal] = useState(false);

  const codeForm = useForm<CodeFormValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      code: search.code || '',
    },
  });

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['appraisal-template', templateId],
    queryFn: () => (templateId ? getAppraisalTemplate(templateId) : null),
    staleTime: 0,
    enabled: !!templateId,
  });

  const { mutate: verifyCode, isPending: isVerifying } = useMutation({
    mutationFn: (data: { code: string }) =>
      verifyAppraisalAccessCode(data.code),
    onSuccess: (data: VerifyCodeResponse) => {
      if (data.valid) {
        setAccessCodeVerified(true);
        setOjtId(data.ojtId);
        setTemplateId(data.templateId);
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
    const ratingsSchema = z.record(z.string(), z.number().min(1).max(5));

    return z.object({
      comments: z.string().optional(),
      ratings: ratingsSchema,
      signature: z.instanceof(File),
    });
  };

  const formSchema = generateFormSchema();
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comments: '',
      ratings: {},
    },
  });

  const { mutate: submitAppraisal, isPending } = useMutation({
    mutationFn: submitAppraisalResponse,
  });

  const onSubmit = (data: FormValues) => {
    try {
      // Get all questions from all categories
      const allQuestions =
        template?.categories.flatMap((category) => category.questions) || [];

      if (allQuestions.length) {
        const unansweredQuestions = allQuestions.filter(
          (question) => !data.ratings?.[question.id],
        );

        if (unansweredQuestions.length > 0) {
          toast.error(
            `Please rate all criteria before submitting. You have ${unansweredQuestions.length} unrated items.`,
          );
          return;
        }
      }

      // Ensure signature is uploaded
      if (!data.signature) {
        toast.error('Please upload your signature before submitting.');
        return;
      }

      // Ensure ratings is not an empty object
      if (Object.keys(data.ratings || {}).length === 0) {
        toast.error('Please rate at least one criterion.');
        return;
      }

      if (!ojtId || !templateId) {
        toast.error('OJT ID or Template ID not found');
        return;
      }

      submitAppraisal(
        {
          templateId,
          ojtId,
          ratings: data.ratings,
          comments: data.comments,
          signature: data.signature,
        },
        {
          onSuccess: () => {
            toast.success('Appraisal submitted successfully!');
            setHasSubmittedAppraisal(true);
          },
          onError: (error) => {
            console.error('Submission error:', error);
            toast.error(
              `Error submitting appraisal: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          },
        },
      );
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(
        'There was an error submitting your appraisal. Please try again.',
      );
    }
  };

  const signature = form.watch('signature');

  // Add a helper function to calculate total points
  const calculateTotalPoints = (
    ratings: Record<string, number> | undefined,
  ): number => {
    if (!ratings) return 0;
    return Object.values(ratings).reduce((sum, rating) => sum + rating, 0);
  };

  if (!accessCodeVerified) {
    return (
      <div className='flex items-center justify-center min-h-screen p-4 bg-gray-50'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Student Appraisal</CardTitle>
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

  if (ojtData?.feedbackSubmitted || hasSubmittedAppraisal) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Appraisal Already Submitted</CardTitle>
            <CardDescription>
              Thank you for submitting your appraisal.
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
          <div className='border border-black'>
            {/* Header with logo and reference information */}
            <table className='w-full'>
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
                      Reference No.: BatStateU-FO-OJT-03
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
              STUDENT-TRAINEE&apos;S PERFORMANCE APPRAISAL REPORT
            </div>

            {/* Student Information */}
            <table className='w-full'>
              <tbody>
                <tr>
                  <td className='border-t border-black p-2 w-1/2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>
                        Student Trainee / Program / Year Level
                      </Label>
                      <div className='border-b border-black pb-1'>
                        {ojtData?.studentName} / {ojtData?.program?.name} /{' '}
                        {ojtData?.yearLevel}
                      </div>
                    </div>
                  </td>
                  <td className='border-t border-l border-black p-2 w-1/2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>Name of Company</Label>
                      <div className='border-b border-black pb-1'>
                        {ojtData?.company?.name}
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className='border-t border-black p-2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>
                        Semester / No. of Training Hours
                      </Label>
                      <div className='border-b border-black pb-1'>
                        {ojtData?.semester} / {ojtData?.totalOJTHours}
                      </div>
                    </div>
                  </td>
                  <td className='border-t border-l border-black p-2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>Address of Company</Label>
                      <div className='border-b border-black pb-1'>
                        {ojtData?.company?.address}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Direction */}
            <div className='border-t border-black p-2 text-sm'>
              <strong>Part I – DIRECTION:</strong> Please rate by checking the
              appropriate column that best describes the performance of the
              above student trainee. Please use the ratings as follows: Five (5)
              being the highest and one (1) the lowest.
            </div>

            {/* Criteria Table Headers */}
            <div className='w-full border-t border-black'>
              <table className='w-full table-fixed'>
                <thead>
                  <tr>
                    <th className='w-1/2 border-r border-black p-2 text-sm text-left'>
                      CRITERIA
                    </th>
                    <th className='w-1/10 border-r border-black p-2 text-center'>
                      <div>5</div>
                      <div className='text-xs'>Outstanding</div>
                    </th>
                    <th className='w-1/10 border-r border-black p-2 text-center'>
                      <div>4</div>
                      <div className='text-xs'>Very Satisfactory</div>
                    </th>
                    <th className='w-1/10 border-r border-black p-2 text-center'>
                      <div>3</div>
                      <div className='text-xs'>Satisfactory</div>
                    </th>
                    <th className='w-1/10 border-r border-black p-2 text-center'>
                      <div>2</div>
                      <div className='text-xs'>Unsatisfactory</div>
                    </th>
                    <th className='w-1/10 p-2 text-center'>
                      <div>1</div>
                      <div className='text-xs'>Poor</div>
                    </th>
                  </tr>
                </thead>
              </table>

              {/* Categories and questions */}
              {template?.categories
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((category) => (
                  <div key={category.id}>
                    {/* Category Header */}
                    <div className='border-t border-black p-2 font-bold'>
                      {category.name}
                    </div>

                    {/* Questions in this category */}
                    <table className='w-full table-fixed'>
                      <tbody>
                        {category.questions.map((question, qIndex) => (
                          <tr key={question.id}>
                            <td className='w-1/2 border-t border-r border-black p-2 text-sm'>
                              {qIndex + 1}. {question.question}
                              {form.formState.errors.ratings &&
                                (
                                  form.formState.errors.ratings as Record<
                                    string,
                                    any
                                  >
                                )?.[question.id.toString()] && (
                                  <p className='text-red-500 text-xs mt-1'>
                                    Please select a rating
                                  </p>
                                )}
                            </td>
                            <td className='w-1/10 border-t border-r border-black text-center'>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={
                                  form.watch(`ratings.${question.id}`) === 5
                                }
                                onChange={() =>
                                  form.setValue(`ratings.${question.id}`, 5)
                                }
                              />
                            </td>
                            <td className='w-1/10 border-t border-r border-black text-center'>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={
                                  form.watch(`ratings.${question.id}`) === 4
                                }
                                onChange={() =>
                                  form.setValue(`ratings.${question.id}`, 4)
                                }
                              />
                            </td>
                            <td className='w-1/10 border-t border-r border-black text-center'>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={
                                  form.watch(`ratings.${question.id}`) === 3
                                }
                                onChange={() =>
                                  form.setValue(`ratings.${question.id}`, 3)
                                }
                              />
                            </td>
                            <td className='w-1/10 border-t border-r border-black text-center'>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={
                                  form.watch(`ratings.${question.id}`) === 2
                                }
                                onChange={() =>
                                  form.setValue(`ratings.${question.id}`, 2)
                                }
                              />
                            </td>
                            <td className='w-1/10 border-t border-black text-center'>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={
                                  form.watch(`ratings.${question.id}`) === 1
                                }
                                onChange={() =>
                                  form.setValue(`ratings.${question.id}`, 1)
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

              {/* Total Points Row */}
              <table className='w-full table-fixed'>
                <tbody>
                  <tr>
                    <td className='w-1/2 border-t border-r border-black p-2 text-right font-bold'>
                      TOTAL POINTS:
                    </td>
                    <td className='border-t border-black p-2' colSpan={5}>
                      {calculateTotalPoints(form.watch('ratings'))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Comments Section */}
            <div className='border-t border-black p-2'>
              <FormField
                control={form.control}
                name='comments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-bold'>
                      COMMENTS/SUGGESTIONS:
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className='border-t border-black rounded-none resize-none h-24 w-full mt-1 p-0 bg-transparent'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Privacy Notice */}
            <div className='border-t border-black p-2'>
              <div className='text-sm'>
                <p>
                  Pursuant to Republic Act No. 10173, also known as the Data
                  Privacy Act of 2012, the Batangas State University, the
                  National Engineering University, recognizes its commitment to
                  protect and respect the privacy of its customers and/or
                  stakeholders and ensure that all information collected from
                  them are all processed in accordance with the principles of
                  transparency, legitimate purpose and proportionality mandated
                  under the Data Privacy Act of 2012.
                </p>
              </div>
            </div>

            {/* Signature */}
            <div className='border-t border-black p-2 flex justify-end'>
              <div className='text-sm'>Rated by:</div>

              <div className='flex flex-col items-end mt-2'>
                <FormField
                  control={form.control}
                  name='signature'
                  render={({ field: { value, onChange, ...fieldProps } }) => (
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
                            className='w-52'
                            type='file'
                            accept='image/*'
                            onChange={(e) =>
                              onChange(e.target.files && e.target.files[0])
                            }
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
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
            </div>
          </div>
          <div className='flex justify-end'>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Submitting...' : 'Submit Appraisal'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
