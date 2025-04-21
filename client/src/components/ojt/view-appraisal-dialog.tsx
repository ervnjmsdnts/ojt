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
import { getAppraisalResponses } from '@/lib/api';
import { useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Eye } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Question = {
  id: number;
  questionId: number;
  rating: number;
  questionText: string;
  categoryId: number;
};

export default function ViewAppraisalDialog({ ojtId }: { ojtId: number }) {
  const { data: appraisalData, isLoading } = useQuery({
    queryKey: ['appraisal-responses', ojtId],
    queryFn: () => getAppraisalResponses({ ojtId }),
  });

  const calculateTotalPoints = (questions: Question[]): number => {
    return questions.reduce((sum, question) => sum + question.rating, 0);
  };

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
        .data-header {
          font-size: 6pt !important;
        }
        p, span, div, label {
          font-size: 8pt !important;
        }
        input[type="radio"]{
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border: 2px solid #000;
          border-radius: 50%;
          display: inline-block;
          vertical-align: middle;
          position: relative;
          cursor: pointer;
        }
        input[type="radio"]::after{
          content: '';
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: #000;
          opacity: 0;
          transition: opacity .15s;
        }
        input[type="radio"]:checked::after{
          opacity: 1;
        }
        input[type="radio"]:disabled{
          opacity: 1;
          pointer-events: none;
          border: none;
        }
        textarea {
          font-size: 8pt !important;
          height: 40px !important;
          border: none !important;
          min-height: 40px !important;
          color: #000 !important;
          opacity: 1 !important;
          background-color: transparent !important;
        }
        textarea:disabled {
          opacity: 1 !important;
          background-color: transparent !important;
          color: #000 !important;
          -webkit-text-fill-color: #000 !important;
        }
        .signature-container {
          min-height: 120px;
          width: 100%;
          break-inside: avoid;
          page-break-inside: avoid;
          display: flex;
          flex-direction: row;
          justify-content: flex-end;
          align-items: flex-start;
        }
        .signature-content {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: center;
        }
        .signature-image {
          max-height: 60px;
          object-fit: contain;
          margin-bottom: 4px;
          display: block;
        }
        .signature-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .privacy-notice {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        /* Ensure the signature table has no borders */
        .signature-section table,
        .signature-section td {
          border: none !important;
          border-collapse: collapse !important;
        }
      }
    `,
    onAfterPrint: () => {
      console.log('Printing completed');
    },
  });

  const latestResponse = useMemo(() => {
    if (!appraisalData || appraisalData.length === 0) return null;
    return appraisalData[0]; // Assuming responses are sorted by date
  }, [appraisalData]);

  const allCategories = useMemo(() => {
    if (!latestResponse) return [];
    return latestResponse.categories;
  }, [latestResponse]);

  const allQuestions = useMemo(() => {
    if (!allCategories) return [];
    return allCategories.flatMap((category) => category.questions);
  }, [allCategories]);

  const totalPoints = useMemo(() => {
    if (!allQuestions) return 0;
    return calculateTotalPoints(allQuestions as Question[]);
  }, [allQuestions]);

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
          <p>View Performance Appraisal</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className='w-[90vw] max-h-[80vh] max-w-none flex flex-col overflow-y-auto h-full'>
        <DialogHeader className='flex flex-row items-center justify-between'>
          <DialogTitle>Student Performance Appraisal</DialogTitle>
          <Button
            className='flex items-center gap-2 w-fit'
            onClick={() => handlePrint()}>
            <Printer className='w-4 h-4' />
            Print Form
          </Button>
        </DialogHeader>
        {isLoading ? (
          <div>Loading...</div>
        ) : !latestResponse ? (
          <div>No appraisal data available</div>
        ) : (
          <div className='border border-black' ref={contentRef}>
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
                        {latestResponse.ojt.studentName} /{' '}
                        {latestResponse.ojt.programName} /{' '}
                        {latestResponse.ojt?.yearLevel}
                      </div>
                    </div>
                  </td>
                  <td className='border-t border-l border-black p-2 w-1/2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>Name of Company</Label>
                      <div className='border-b border-black pb-1'>
                        {latestResponse.ojt.companyName}
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
                        {latestResponse.ojt?.semester} /{' '}
                        {latestResponse.ojt?.totalOJTHours}
                      </div>
                    </div>
                  </td>
                  <td className='border-t border-l border-black p-2'>
                    <div className='flex flex-col gap-2'>
                      <Label className='text-xs'>Address of Company</Label>
                      <div className='border-b border-black pb-1'>
                        {latestResponse.ojt.companyAddress}
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
                      <div className='text-xs data-header'>Outstanding</div>
                    </th>
                    <th className='w-1/10 border-r border-black p-2 text-center'>
                      <div>4</div>
                      <div className='text-xs data-header'>
                        Very Satisfactory
                      </div>
                    </th>
                    <th className='w-1/10 border-r border-black p-2 text-center'>
                      <div>3</div>
                      <div className='text-xs data-header'>Satisfactory</div>
                    </th>
                    <th className='w-1/10 border-r border-black p-2 text-center'>
                      <div>2</div>
                      <div className='text-xs data-header'>Unsatisfactory</div>
                    </th>
                    <th className='w-1/10 p-2 text-center'>
                      <div>1</div>
                      <div className='text-xs data-header'>Poor</div>
                    </th>
                  </tr>
                </thead>
              </table>

              {/* Categories and questions */}
              {allCategories
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
                              {qIndex + 1}. {question.questionText}
                            </td>
                            <td className='w-1/10 border-t border-r border-black text-center'>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={question.rating === 5}
                                disabled
                              />
                            </td>
                            <td className='w-1/10 border-t border-r border-black text-center'>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={question.rating === 4}
                                disabled
                              />
                            </td>
                            <td className='w-1/10 border-t border-r border-black text-center'>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={question.rating === 3}
                                disabled
                              />
                            </td>
                            <td className='w-1/10 border-t border-r border-black text-center'>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={question.rating === 2}
                                disabled
                              />
                            </td>
                            <td className='w-1/10 border-t border-black text-center'>
                              <input
                                type='radio'
                                className='h-4 w-4'
                                checked={question.rating === 1}
                                disabled
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
                      {latestResponse.totalPoints || totalPoints}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Comments Section */}
            <div className='border-t border-black p-2'>
              <Label className='text-sm font-bold'>COMMENTS/SUGGESTIONS:</Label>
              <Textarea
                value={latestResponse.comments || ''}
                className='border-t border-black rounded-none resize-none h-24 w-full mt-1 p-0 bg-transparent'
                disabled
              />
            </div>

            {/* Privacy Notice */}
            <div className='border-t border-black p-2 privacy-notice'>
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
            <div className='border-t border-black p-2 signature-section'>
              <table className='w-full border-0'>
                <tbody>
                  <tr>
                    <td className='w-3/4 text-right pr-2 align-top'>
                      <span className='text-sm inline-block pt-6'>
                        Rated by:
                      </span>
                    </td>
                    <td className='w-1/4'>
                      <div className='flex flex-col items-center'>
                        {latestResponse.supervisorSignature && (
                          <img
                            src={latestResponse.supervisorSignature}
                            alt='Signature'
                            className='h-24 object-cover signature-image'
                          />
                        )}
                        <div className='text-center pt-1'>
                          <p>{latestResponse.ojt.supervisorName}</p>
                          <div className='border-t border-black mt-1 w-64 pt-1'>
                            <div className='text-sm'>
                              Signature over Printed Name of
                            </div>
                            <div className='text-sm'>Training Supervisor</div>
                            <div className='text-sm mt-2'>
                              Date:{' '}
                              {format(
                                new Date(
                                  latestResponse.responseDate ||
                                    latestResponse.supervisorSignatureDate ||
                                    new Date(),
                                ),
                                'MMMM d, yyyy',
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Part II - OJT Coordinator Section */}
            <div className='border-t border-black'>
              <div className='p-2 font-bold'>
                Part II – To be accomplished by the OJT Coordinator:
              </div>
              <table className='w-full'>
                <tbody>
                  <tr>
                    <td className='p-2 w-3/4'>
                      <div className='flex flex-col gap-2'>
                        <div className='flex items-baseline'>
                          <span>Name of Student-Trainee:</span>
                          <div className='border-b border-black flex-grow ml-1'></div>
                        </div>
                        <div className='flex items-baseline'>
                          <span>Name of Company:</span>
                          <div className='border-b border-black flex-grow ml-1'></div>
                        </div>
                      </div>
                    </td>
                    <td className='p-2 w-1/4'>
                      <div className='flex flex-col gap-2'>
                        <div className='flex items-baseline'>
                          <span>Program/Year:</span>
                          <div className='border-b border-black flex-grow ml-1'></div>
                        </div>
                        <div className='flex items-baseline'>
                          <span>Semester:</span>
                          <div className='border-b border-black flex-grow ml-1'></div>
                          <span className='ml-2'>A.Y.:</span>
                          <div className='border-b border-black flex-grow ml-1'></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Part III - Performance Appraisal */}
            <div className='border-t border-black'>
              <div className='p-2 font-bold'>
                Part III – In-Plant Performance Appraisal
                <span className='float-right font-normal'>
                  60% = _______________
                </span>
              </div>
              <div className='p-2'>
                OJT Coordinator Performance Appraisal and other requirements
                <span className='float-right'>40% = _______________</span>
              </div>
              <div className='p-2 text-right'>
                <div>Total: 100% = _______________</div>
                <div>Final Grade: _______________</div>
              </div>
            </div>

            {/* Grading System */}
            <div className='border-t border-black'>
              <div className='p-2 font-bold'>Grading System</div>
              <div className=''>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-black'>
                      <th className='text-left p-2'>Numerical Grade</th>
                      <th className='text-left p-2'>Equivalent</th>
                      <th className='text-left p-2'>Description</th>
                      <th className='text-left p-2'>Numerical Grade</th>
                      <th className='text-left p-2'>Equivalent</th>
                      <th className='text-left p-2'>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className='p-2'>1.00</td>
                      <td className='p-2'>98-100</td>
                      <td className='p-2'>Excellent</td>
                      <td className='p-2'>2.50</td>
                      <td className='p-2'>80-82</td>
                      <td className='p-2'>Satisfactory</td>
                    </tr>
                    <tr>
                      <td className='p-2'>1.25</td>
                      <td className='p-2'>94-97</td>
                      <td className='p-2'>Superior</td>
                      <td className='p-2'>2.75</td>
                      <td className='p-2'>78-79</td>
                      <td className='p-2'>Fairly Satisfactory</td>
                    </tr>
                    <tr>
                      <td className='p-2'>1.50</td>
                      <td className='p-2'>90-93</td>
                      <td className='p-2'>Very Good</td>
                      <td className='p-2'>3.00</td>
                      <td className='p-2'>75-77</td>
                      <td className='p-2'>Passing</td>
                    </tr>
                    <tr>
                      <td className='p-2'>1.75</td>
                      <td className='p-2'>88-89</td>
                      <td className='p-2'>Good</td>
                      <td className='p-2'>5.00</td>
                      <td className='p-2'>Below 75</td>
                      <td className='p-2'>Failure</td>
                    </tr>
                    <tr>
                      <td className='p-2'>2.00</td>
                      <td className='p-2'>85-87</td>
                      <td className='p-2'>Meritorious</td>
                      <td className='p-2'>Inc.</td>
                      <td className='p-2'></td>
                      <td className='p-2'>Incomplete</td>
                    </tr>
                    <tr>
                      <td className='p-2'>2.25</td>
                      <td className='p-2'>83-84</td>
                      <td className='p-2'>Very Satisfactory</td>
                      <td className='p-2'>Drp</td>
                      <td className='p-2'></td>
                      <td className='p-2'>Dropped</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rater/Coordinator Signature */}
            <div className='border-t border-black p-2'>
              <div className='text-center'>Rater:</div>
              <div className='flex justify-center mt-16'>
                <div className='text-center'>
                  <div className='border-t border-black w-64'></div>
                  <div className='text-sm'>Signature over Printed Name of</div>
                  <div className='text-sm'>OJT Coordinator</div>
                  <div className='text-sm mt-2 text-left'>Date:</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
