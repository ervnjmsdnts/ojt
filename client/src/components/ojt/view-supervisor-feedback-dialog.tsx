import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import BSULogo from '@/assets/bsu-logo.png';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import {
  getSupervisorFeedbackResponses,
  getSupervisorFeedbackTemplates,
} from '@/lib/api';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useReactToPrint } from 'react-to-print';
import { Printer, Eye } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Question = {
  id: number;
  question: string;
};

export default function ViewSupervisorFeedbackDialog({
  ojtId,
}: {
  ojtId: number;
}) {
  const { data: ojtData, isLoading: ojtDataLoading } = useQuery({
    queryKey: ['supervisor-feedback-responses', ojtId],
    queryFn: () => getSupervisorFeedbackResponses({ ojtId }),
  });

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['supervisor-feedback-templates'],
    queryFn: getSupervisorFeedbackTemplates,
    staleTime: 0,
  });

  const [existingSignatureUrl, setExistingSignatureUrl] = useState<
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
      feedback: {},
    },
  });

  const isLoading = useMemo(() => {
    return ojtDataLoading || templateLoading;
  }, [ojtDataLoading, templateLoading]);

  // Effect to check for existing responses and prepopulate form
  useEffect(() => {
    if (ojtData && ojtData.length > 0) {
      // Get the most recent response (should be first in the array)
      const latestResponse = ojtData[0];

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
        otherCommentsAndSuggestions:
          latestResponse.otherCommentsAndSuggestions || '',
        feedback: feedbackValues,
      });
    }
  }, [ojtData]);

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

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button size='icon'>
              <Eye className='w-4 h-4' />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>View Supervisor Feedback</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className='w-[90vw] max-h-[80vh] max-w-none flex flex-col overflow-y-auto h-full'>
        <DialogHeader className='flex flex-row items-center justify-between'>
          <DialogTitle>Supervisor Feedback</DialogTitle>
          <Button
            className='flex items-center gap-2 w-fit'
            onClick={() => handlePrint()}>
            <Printer className='w-4 h-4' />
            Print Form
          </Button>
        </DialogHeader>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Form {...form}>
            <form>
              <div
                className='border border-black form-container'
                ref={contentRef}>
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
                          {ojtData?.[0]?.ojt?.supervisorName}
                        </div>
                      </td>
                      <td className='border-t border-l border-black p-2 w-1/2'>
                        <div className='flex flex-col gap-2'>
                          <Label className='text-xs'>Department:</Label>
                          {ojtData?.[0]?.ojt?.departmentName}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className='border-t border-black p-2'>
                        <div className='flex flex-col gap-2'>
                          <Label className='text-xs'>Name of Company:</Label>
                          {ojtData?.[0]?.ojt?.companyName}
                        </div>
                      </td>
                      <td className='border-t border-l border-black p-2'>
                        <div className='flex flex-col gap-2'>
                          <Label className='text-xs'>Date of Monitoring:</Label>
                          {ojtData?.[0]?.responseDate
                            ? format(
                                new Date(ojtData?.[0]?.responseDate),
                                'MMMM d, yyyy',
                              )
                            : 'N/A'}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className='border-t border-black p-2'>
                        <div className='flex flex-col gap-2'>
                          <Label className='text-xs'>
                            Name of the Student-Trainee:
                          </Label>
                          {ojtData?.[0]?.ojt?.studentName}
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
                            (
                              form.formState.errors.feedback as Record<
                                string,
                                any
                              >
                            )[question.id.toString()] && (
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
                                    disabled
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
                                    disabled
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
                                    disabled
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
                                    disabled
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
                                    disabled
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
                                  disabled
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
                            Pursuant to Republic Act No. 10173, also known as
                            the Data Privacy Act of 2012, the Batangas State
                            University, the National Engineering University
                            recognizes its commitment to protect and respect the
                            privacy of its customers and/or stakeholders and
                            ensure that all information collected from them are
                            all processed in accordance with the principles of
                            transparency, legitimate purpose and proportionality
                            mandated under the Data Privacy Act of 2012.
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
                          <div className='flex flex-col items-center gap-2'>
                            {existingSignatureUrl && (
                              <img
                                src={existingSignatureUrl}
                                alt='Signature'
                                className='h-24 object-cover'
                              />
                            )}
                            <div className='text-center pt-1'>
                              <p>{ojtData?.[0]?.ojt?.supervisorName}</p>
                              <div className='border-t border-black mt-1 w-64 pt-1'>
                                <div className='text-sm'>
                                  Signature over Printed Name of
                                </div>
                                <div className='text-sm'>
                                  Training Supervisor
                                </div>
                                <div className='text-sm mt-2'>
                                  Date:{' '}
                                  {format(
                                    new Date(
                                      ojtData?.[0]?.responseDate || new Date(),
                                    ),
                                    'MMMM d, yyyy',
                                  )}
                                </div>
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
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
