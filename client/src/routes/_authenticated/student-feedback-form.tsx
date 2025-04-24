import { SidebarInset } from '@/components/ui/sidebar';
import { createFileRoute } from '@tanstack/react-router';
import PageHeaderText from '@/components/page-header-text';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import BSULogo from '@/assets/bsu-logo.png';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getCurrentOJT,
  getStudentFeedbackTemplates,
  studentFeedbackResponse,
  getStudentOJTFeedbackResponses,
} from '@/lib/api';
import { format } from 'date-fns';
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
import { useRef, useEffect, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, Printer } from 'lucide-react';
import { toast } from 'sonner';
export const Route = createFileRoute('/_authenticated/student-feedback-form')({
  component: RouteComponent,
});

type Question = {
  id: number;
  question: string;
};

function RouteComponent() {
  const { isLoading, data: studentOJT } = useQuery({
    queryKey: ['student-ojt'],
    queryFn: getCurrentOJT,
  });

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['student-feedback-templates'],
    queryFn: getStudentFeedbackTemplates,
    staleTime: 0,
  });

  const { data: feedbackResponses, isLoading: feedbackResponsesLoading } =
    useQuery({
      queryKey: ['student-feedback-responses'],
      queryFn: getStudentOJTFeedbackResponses,
    });

  const [hasExistingResponse, setHasExistingResponse] = useState(false);
  const [existingSignatureUrl, setExistingSignatureUrl] = useState<
    string | null
  >(null);
  const [existingResponseDate, setExistingResponseDate] = useState<
    string | null
  >(null);

  // Dynamically generate schema based on template questions
  const generateFormSchema = () => {
    const feedbackSchema = z.record(
      z.string(),
      z.string().min(1, 'Please select an option'),
    );

    // If there's an existing response, we don't require a new signature
    return z.object({
      problemsMet: z.string().optional(),
      otherConcerns: z.string().optional(),
      feedback: feedbackSchema,
      signature: z.instanceof(File),
    });
  };

  const formSchema = generateFormSchema();
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      problemsMet: '',
      otherConcerns: '',
      feedback: {},
    },
  });

  // Effect to check for existing responses and prepopulate form
  useEffect(() => {
    if (feedbackResponses && feedbackResponses.length > 0 && template) {
      // We have an existing response
      setHasExistingResponse(true);
      setExistingResponseDate(
        feedbackResponses[0].responseDate
          ? format(new Date(feedbackResponses[0].responseDate), 'MMMM d, yyyy')
          : null,
      );

      // Get the most recent response (should be first in the array)
      const latestResponse = feedbackResponses[0];

      // Set signature URL if available
      if (latestResponse.signature) {
        setExistingSignatureUrl(latestResponse.signature);
      }

      // Prepare feedback object from question responses
      const feedbackValues: Record<string, string> = {};
      latestResponse.questionResponses.forEach((qr) => {
        feedbackValues[qr.questionId.toString()] = qr.responseValue;
      });

      // Reset form with existing values
      form.reset({
        problemsMet: latestResponse.problems || '',
        otherConcerns: latestResponse.otherConcerns || '',
        feedback: feedbackValues,
      });
    }
  }, [feedbackResponses, template, form]);

  const signature = form.watch('signature');

  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 5mm;
      }
      @media print {
        html, body {
          height: 100%;
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
        table {
          page-break-inside: avoid;
          font-size: 8pt !important;
        }
        td, th {
          padding: 2px !important;
          font-size: 8pt !important;
        }
        p, span, div, label {
          font-size: 8pt !important;
        }
/* base look -------------------------------------------------- */
input[type="radio"]{
  appearance:none;            /* Firefox/Chromium */
  -webkit-appearance:none;    /* Safari */

  /* size & outer ring */
  width:16px;
  height:16px;
  border:2px solid #000;
  border-radius:50%;
  display:inline-block;
  vertical-align:middle;
  position:relative;
  cursor:pointer;
}

/* inner dot when checked ------------------------------------ */
input[type="radio"]::after{
  content:'';
  position:absolute;
  inset:2px;
  border-radius:50%;
  background:#000;
  opacity:0;                  /* hidden until checked */
  transition:opacity .15s;
}

input[type="radio"]:checked::after{
  opacity:1;
}

/* looks identical when disabled, but can’t be clicked --------*/
input[type="radio"]:disabled{
  opacity:1;                  /* no greying‑out */
  pointer-events:none;        /* block interaction */
  border: none;
}
        .form-container {
          transform: scale(0.92);
          transform-origin: top center;
        }
        .privacy-text {
          font-size: 7pt !important;
        }
        .signature-section {
          margin-top: 0 !important;
          margin-bottom: 0 !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }
        .signature-line {
          margin-bottom: 2px !important;
        }
        textarea, .feedback-textarea {
          font-size: 8pt !important;
          height: 40px !important;
          border: none !important;
          min-height: 40px !important;
          color: #000 !important;
          opacity: 1 !important;
          background-color: transparent !important;
        }
        textarea:disabled, .feedback-textarea:disabled {
          opacity: 1 !important;
          background-color: transparent !important;
          color: #000 !important;
          -webkit-text-fill-color: #000 !important;
        }
        .hide-file-input {
          display: none !important;
        }
      }
    `,
    onAfterPrint: () => {
      console.log('Printing completed');
    },
  });

  const { mutate: submitFeedback, isPending } = useMutation({
    mutationFn: studentFeedbackResponse,
  });

  const onSubmit = (data: FormValues) => {
    // If user has already submitted, don't allow re-submission
    if (hasExistingResponse) {
      return;
    }

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

      submitFeedback(
        {
          templateId: template!.id,
          ...data,
        },
        {
          onSuccess: () => {
            toast.success('Feedback submitted successfully!');
            // Set has existing response to true after successful submission
            setHasExistingResponse(true);
            // No need to reset the form as we want to keep showing the submitted data
          },
          onError: (error) => {
            console.error('Submission error:', error);
            toast.error(
              `Error submitting feedback: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          },
        },
      );
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(
        'There was an error submitting your feedback. Please try again.',
      );
    }
  };

  if (isLoading || templateLoading || feedbackResponsesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>Student Feedback Form</PageHeaderText>

      {hasExistingResponse && (
        <Alert variant='default'>
          <InfoIcon className='h-4 w-4' />
          <AlertTitle>You have already submitted feedback</AlertTitle>
          <AlertDescription>
            Your feedback has been recorded. You can view and print it, but you
            cannot modify it.
          </AlertDescription>
        </Alert>
      )}
      {hasExistingResponse && (
        <div className='flex justify-end'>
          <Button
            className='flex items-center gap-2 w-fit'
            onClick={() => handlePrint()}>
            <Printer className='w-4 h-4' />
            Print Form
          </Button>
        </div>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-4'>
          <div className='border border-black form-container' ref={contentRef}>
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
                      Reference No.: BatStateU-FO-OJT-05
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
              STUDENT-TRAINEE'S FEEDBACK FORM
            </div>

            {/* Student Information */}
            <table className='w-full border-collapse'>
              <tbody>
                <tr>
                  <td className='border-t border-black p-2 w-1/2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>
                        Name of the Student-Trainee:
                      </Label>
                      {studentOJT?.student?.fullName}
                    </div>
                  </td>
                  <td className='border-t border-l border-black p-2 w-1/2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>Program:</Label>
                      {studentOJT?.program?.name}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className='border-t border-black p-2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>Name of Company:</Label>
                      {studentOJT?.company?.name}
                    </div>
                  </td>
                  <td className='border-t border-l border-black p-2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>Department:</Label>
                      {studentOJT?.department?.name}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className='border-t border-black p-2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>Date of Monitoring:</Label>
                      {existingResponseDate
                        ? existingResponseDate
                        : format(new Date(), 'MMMM d, yyyy')}
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
                                disabled={hasExistingResponse}
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
                                disabled={hasExistingResponse}
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
                                disabled={hasExistingResponse}
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
                                disabled={hasExistingResponse}
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
                                disabled={hasExistingResponse}
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
                      name='problemsMet'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-bold'>
                            Problems Met:
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className='border-t border-black rounded-none resize-none h-24 w-full mt-1 p-0 bg-transparent feedback-textarea'
                              disabled={hasExistingResponse}
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

            {/* Other Concerns */}
            <table className='w-full border-collapse'>
              <tbody>
                <tr>
                  <td className='border-t border-black p-2'>
                    <FormField
                      control={form.control}
                      name='otherConcerns'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-bold'>
                            Other Concerns:
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className='border-t border-black rounded-none resize-none h-24 w-full mt-1 p-0 bg-transparent feedback-textarea'
                              disabled={hasExistingResponse}
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
                      {hasExistingResponse && existingSignatureUrl ? (
                        // Display existing signature
                        <div className='flex flex-col items-center gap-2'>
                          <img
                            src={existingSignatureUrl}
                            alt='Signature'
                            className='h-24 object-cover'
                          />
                          <div className='text-sm text-center border-t border-black pt-1'>
                            Student-Trainee&apos;s Signature
                          </div>
                        </div>
                      ) : (
                        // Signature upload for new submission
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
                                    disabled={hasExistingResponse}
                                  />
                                  <div className='text-sm text-center border-t border-black pt-1'>
                                    Student-Trainee&apos;s Signature
                                  </div>
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                      <div className='text-sm'>
                        Date:{' '}
                        {existingResponseDate
                          ? existingResponseDate
                          : format(new Date(), 'MMMM d, yyyy')}
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
            {!hasExistingResponse && (
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Feedback'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </SidebarInset>
  );
}
