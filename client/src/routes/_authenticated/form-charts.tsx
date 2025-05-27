import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Text,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEffect, useState, useMemo, useRef } from 'react';
import {
  getAllFeedbackResponses,
  getDepartments,
  getPrograms,
  getUnansweredFeedback,
} from '@/lib/api';
import { SidebarInset } from '@/components/ui/sidebar';
import PageHeaderText from '@/components/page-header-text';
import { Label as FormLabel } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import { ACADEMIC_YEARS } from '@/lib/constants';
// Custom X-Axis Tick component to render wrapped text
const CustomXAxisTick = (props: any) => {
  const { x, y, payload, questions } = props;
  const question = questions.find((q: any) => q.id === payload.value);

  if (!question) return null;

  // Format the question text with line breaks for readability
  const formattedText = formatQuestionForDisplay(question.text);

  return (
    <g transform={`translate(${x},${y})`}>
      {formattedText.map((line, i) => (
        <Text
          key={i}
          x={0}
          y={i * 15} // Increased spacing between lines
          dy={24}
          textAnchor='middle'
          fontSize={12} // Slightly smaller font
          width={100}
          fill='#666'>
          {line}
        </Text>
      ))}
    </g>
  );
};

// Helper function to format question text with proper line breaks
function formatQuestionForDisplay(text: string): string[] {
  // First add the question number
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  // Create shorter lines with fewer characters per line
  words.forEach((word) => {
    if (currentLine.length + word.length > 12) {
      // Reduced max line length
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// Helper function to prepare data for the chart in the format needed
function prepareChartData(feedbackData: FeedbackChartData[]) {
  // Transform data for chart display
  const chartData = feedbackData.map((item) => ({
    id: item.id,
    name: item.id, // Use ID as the name for the x-axis
    SA: item.SA,
    A: item.A,
    N: item.N,
    D: item.D,
    SD: item.SD,
  }));

  // Prepare question data for the custom X-axis
  const questionData = feedbackData.map((item) => ({
    id: item.id,
    text: item.question,
  }));

  return {
    chartData,
    questionData,
  };
}

// Helper function to prepare unanswered data for chart
function prepareUnansweredChartData(
  studentCount: number,
  supervisorCount: number,
) {
  return [
    {
      name: 'Student Feedback',
      count: studentCount,
    },
    {
      name: 'Supervisor Feedback',
      count: supervisorCount,
    },
  ];
}

export const Route = createFileRoute('/_authenticated/form-charts')({
  component: RouteComponent,
});

type FeedbackChartData = {
  id: number;
  question: string;
  SA: number;
  A: number;
  N: number;
  D: number;
  SD: number;
};

type QuestionResponse = {
  question: string;
  SA: number;
  A: number;
  N: number;
  D: number;
  SD: number;
};

type Department = {
  id: number;
  name: string;
};

type Program = {
  id: number;
  name: string;
};

function RouteComponent() {
  const [chartData, setChartData] = useState<{
    student: FeedbackChartData[];
    supervisor: FeedbackChartData[];
  }>({
    student: [],
    supervisor: [],
  });

  const [formattedData, setFormattedData] = useState({
    student: {
      chartData: [] as any[],
      questionData: [] as any[],
    },
    supervisor: {
      chartData: [] as any[],
      questionData: [] as any[],
    },
  });

  // State for filters
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | undefined
  >();
  const [selectedProgramId, setSelectedProgramId] = useState<
    number | undefined
  >();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<
    string | undefined
  >();
  const [availablePrograms, setAvailablePrograms] = useState<Program[]>([]);

  // Query for departments and programs
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const { data: allPrograms, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: getPrograms,
  });

  // Set available programs directly from allPrograms
  useEffect(() => {
    if (allPrograms) {
      setAvailablePrograms(allPrograms);
    }
  }, [allPrograms]);

  // Query for feedback responses with filters
  const {
    data,
    isLoading: isLoadingFeedback,
    refetch,
  } = useQuery({
    queryKey: [
      'feedback-responses',
      selectedDepartmentId,
      selectedProgramId,
      selectedAcademicYear,
    ],
    queryFn: () =>
      getAllFeedbackResponses({
        departmentId: selectedDepartmentId,
        programId: selectedProgramId,
        academicYear: selectedAcademicYear,
      }),
  });

  // // Query for unanswered feedback counts - always call this hook regardless of data state
  const { data: unansweredData, isLoading: isLoadingUnanswered } = useQuery({
    queryKey: [
      'unanswered-feedback',
      selectedDepartmentId,
      selectedProgramId,
      selectedAcademicYear,
    ],
    queryFn: () =>
      getUnansweredFeedback({
        departmentId: selectedDepartmentId,
        programId: selectedProgramId,
        academicYear: selectedAcademicYear,
      }),
  });

  useEffect(() => {
    if (!data) return;

    // Process data for student feedback
    const studentQuestionMap = new Map<string, QuestionResponse>();
    const supervisorQuestionMap = new Map<string, QuestionResponse>();

    // Process student feedback
    if (data.student && data.student.length > 0) {
      data.student.forEach((response: any) => {
        response.questionResponses.forEach((qr: any) => {
          if (qr.questionText && !studentQuestionMap.has(qr.questionText)) {
            studentQuestionMap.set(qr.questionText, {
              question: qr.questionText,
              SA: 0,
              A: 0,
              N: 0,
              D: 0,
              SD: 0,
            });
          }

          const current = studentQuestionMap.get(qr.questionText!)!;
          current[qr.responseValue as keyof QuestionResponse]++;
          studentQuestionMap.set(qr.questionText!, current);
        });
      });
    }

    // Process supervisor feedback
    if (data.supervisor && data.supervisor.length > 0) {
      data.supervisor.forEach((response: any) => {
        response.questionResponses.forEach((qr: any) => {
          if (qr.questionText && !supervisorQuestionMap.has(qr.questionText)) {
            supervisorQuestionMap.set(qr.questionText, {
              question: qr.questionText,
              SA: 0,
              A: 0,
              N: 0,
              D: 0,
              SD: 0,
            });
          }

          const current = supervisorQuestionMap.get(qr.questionText!)!;
          current[qr.responseValue as keyof QuestionResponse]++;
          supervisorQuestionMap.set(qr.questionText!, current);
        });
      });
    }

    // Convert to arrays with IDs for the chart component
    const studentArray = Array.from(studentQuestionMap.entries()).map(
      ([question, data], index) => ({
        id: index + 1,
        ...data,
      }),
    );

    const supervisorArray = Array.from(supervisorQuestionMap.entries()).map(
      ([question, data], index) => ({
        id: index + 1,
        ...data,
      }),
    );

    setChartData({
      student: studentArray,
      supervisor: supervisorArray,
    });

    // Format data for new chart format
    const studentFormatted = prepareChartData(studentArray);
    const supervisorFormatted = prepareChartData(supervisorArray);

    setFormattedData({
      student: studentFormatted,
      supervisor: supervisorFormatted,
    });
  }, [data]);

  // Handle filter changes
  const handleDepartmentChange = (value: string) => {
    const departmentId = value === 'all' ? undefined : parseInt(value);
    setSelectedDepartmentId(departmentId);
  };

  const handleProgramChange = (value: string) => {
    const programId = value === 'all' ? undefined : parseInt(value);
    setSelectedProgramId(programId);
  };

  const handleAYChange = (value: string) => {
    setSelectedAcademicYear(value);
  };

  const handleClearFilters = () => {
    setSelectedDepartmentId(undefined);
    setSelectedProgramId(undefined);
    setSelectedAcademicYear(undefined);
    refetch();
  };

  // Prepare unanswered data for chart - moved from render section to ensure consistent hook calls
  const unansweredChartData = useMemo(() => {
    if (!unansweredData) return [];
    const studentCount = unansweredData.student?.count || 0;
    const supervisorCount = unansweredData.supervisor?.count || 0;
    return prepareUnansweredChartData(studentCount, supervisorCount);
  }, [unansweredData]);

  const isLoading = useMemo(() => {
    return (
      isLoadingFeedback ||
      isLoadingDepartments ||
      isLoadingPrograms ||
      isLoadingUnanswered
    );
  }, [
    isLoadingFeedback,
    isLoadingDepartments,
    isLoadingPrograms,
    isLoadingUnanswered,
  ]);

  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    pageStyle: '@media print { @page { size: A4; margin: 200mm !important }}',
  });

  if (isLoading) {
    return <div className='p-4'>Loading data...</div>;
  }

  const chartColors = {
    SA: '#4C71DD',
    A: '#FF8042',
    N: '#00C49F',
    D: '#FFBB28',
    SD: '#FF0000',
  };

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>Feedback Summary</PageHeaderText>

      {/* Filter UI */}
      <Card className='mb-4'>
        <CardHeader>
          <CardTitle>Filter Feedback Responses</CardTitle>
          <CardDescription>
            Select department and program to filter the feedback responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-4 items-end'>
            <div className='flex-1 min-w-[200px]'>
              <FormLabel htmlFor='department-select'>Department</FormLabel>
              <Select
                value={selectedDepartmentId?.toString() || 'all'}
                onValueChange={handleDepartmentChange}>
                <SelectTrigger id='department-select'>
                  <SelectValue placeholder='Select department' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Departments</SelectItem>
                  {!isLoading &&
                    departments &&
                    departments.map((department) => (
                      <SelectItem
                        key={department.id}
                        value={department.id.toString()}>
                        {department.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex-1 min-w-[200px]'>
              <FormLabel htmlFor='program-select'>Program</FormLabel>
              <Select
                value={selectedProgramId?.toString() || 'all'}
                onValueChange={handleProgramChange}>
                <SelectTrigger id='program-select'>
                  <SelectValue placeholder='Select program' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Programs</SelectItem>
                  {!isLoading &&
                    availablePrograms &&
                    availablePrograms.map((program) => (
                      <SelectItem
                        key={program.id}
                        value={program.id.toString()}>
                        {program.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex-1 min-w-[200px]'>
              <FormLabel htmlFor='ay-select'>A.Y.</FormLabel>
              <Select
                value={selectedAcademicYear || 'all'}
                onValueChange={handleAYChange}>
                <SelectTrigger id='ay-select'>
                  <SelectValue placeholder='Select academic year' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Academic Years</SelectItem>
                  {ACADEMIC_YEARS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant='outline' onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className='flex justify-end'>
        <Button onClick={() => reactToPrintFn()}>
          <Printer />
          Print
        </Button>
      </div>

      {/* Display message if no data */}
      {chartData.student.length === 0 && chartData.supervisor.length === 0 && (
        <div className='py-8 text-center'>
          <h3 className='text-lg font-medium mb-2'>No feedback data found</h3>
          <p className='text-muted-foreground'>
            Try adjusting your filters or check back later when more feedback is
            submitted.
          </p>
        </div>
      )}

      {/* Table and Charts - only show if there's data */}
      {(chartData.student.length > 0 ||
        chartData.supervisor.length > 0 ||
        unansweredData?.student?.count > 0 ||
        unansweredData?.supervisor?.count > 0) && (
        <div className='flex flex-col gap-16'>
          <div ref={contentRef} className='flex flex-col gap-16'>
            {/* Student feedback table and chart */}
            {chartData.student.length > 0 && (
              <>
                <div className='overflow-x-auto'>
                  <table className='w-full border-collapse border-l border-t border-r border-black'>
                    <thead>
                      <tr>
                        <th colSpan={6} className='text-center font-bold p-2'>
                          Student Trainees Feedback
                        </th>
                      </tr>
                      <tr>
                        <th
                          colSpan={6}
                          className='text-center italic font-normal p-1 text-sm'>
                          S-Strongly Agree, A-Agree, N-Neutral, D-Disagree,
                          SD-Strongly Disagree
                        </th>
                      </tr>
                      <tr>
                        <th className='w-[60%] border border-black p-2 text-left'></th>
                        <th className='w-[8%] text-center border border-black p-2'>
                          SA
                        </th>
                        <th className='w-[8%] text-center border border-black p-2'>
                          A
                        </th>
                        <th className='w-[8%] text-center border border-black p-2'>
                          N
                        </th>
                        <th className='w-[8%] text-center border border-black p-2'>
                          D
                        </th>
                        <th className='w-[8%] text-center border border-black p-2'>
                          SD
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.student.map((item, idx) => (
                        <tr key={idx}>
                          <td className='border border-black p-2 font-normal'>
                            {idx + 1}. {item.question}
                          </td>
                          <td className='text-center border border-black p-2'>
                            {item.SA}
                          </td>
                          <td className='text-center border border-black p-2'>
                            {item.A}
                          </td>
                          <td className='text-center border border-black p-2'>
                            {item.N}
                          </td>
                          <td className='text-center border border-black p-2'>
                            {item.D}
                          </td>
                          <td className='text-center border border-black p-2'>
                            {item.SD}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Combined Chart for Student Feedback */}
                <div className='border'>
                  <div className='mt-8'>
                    <h3 className='text-lg font-medium text-center mb-4'>
                      Student Trainees Feedback
                    </h3>
                    <div style={{ width: '100%', height: 600 }}>
                      <ResponsiveContainer width='100%' height='100%'>
                        <BarChart
                          data={formattedData.student.chartData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 30,
                            bottom: 130, // Increased bottom margin
                          }}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis
                            dataKey='name'
                            height={130} // Increased height for labels
                            tick={
                              <CustomXAxisTick
                                questions={formattedData.student.questionData}
                              />
                            }
                            interval={0}
                          />
                          <YAxis
                            domain={[0, 180]}
                            ticks={[0, 20, 40, 60, 80, 100, 120, 140, 160, 180]}
                          />
                          <Tooltip />
                          <Legend wrapperStyle={{ bottom: 0, left: 0 }} />
                          <Bar
                            dataKey='SA'
                            fill={chartColors.SA}
                            name='S'
                            barSize={20}
                          />
                          <Bar
                            dataKey='A'
                            fill={chartColors.A}
                            name='A'
                            barSize={20}
                          />
                          <Bar
                            dataKey='N'
                            fill={chartColors.N}
                            name='N'
                            barSize={20}
                          />
                          <Bar
                            dataKey='D'
                            fill={chartColors.D}
                            name='D'
                            barSize={20}
                          />
                          <Bar
                            dataKey='SD'
                            fill={chartColors.SD}
                            name='SD'
                            barSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Supervisor feedback table and chart */}
            {chartData.supervisor.length > 0 && (
              <>
                <div className='mb-8 overflow-x-auto'>
                  <table className='w-full border-collapse border-l border-t border-r border-black'>
                    <thead>
                      <tr>
                        <th colSpan={6} className='text-center font-bold p-2'>
                          Training Supervisor&apos;s Feedback
                        </th>
                      </tr>
                      <tr>
                        <th
                          colSpan={6}
                          className='text-center italic font-normal p-1 text-sm'>
                          S-Strongly Agree, A-Agree, N-Neutral, D-Disagree,
                          SD-Strongly Disagree
                        </th>
                      </tr>
                      <tr>
                        <th className='w-[60%] border border-black p-2 text-left'></th>
                        <th className='w-[8%] text-center border border-black p-2'>
                          SA
                        </th>
                        <th className='w-[8%] text-center border border-black p-2'>
                          A
                        </th>
                        <th className='w-[8%] text-center border border-black p-2'>
                          N
                        </th>
                        <th className='w-[8%] text-center border border-black p-2'>
                          D
                        </th>
                        <th className='w-[8%] text-center border border-black p-2'>
                          SD
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.supervisor.map((item, idx) => (
                        <tr key={idx}>
                          <td className='border border-black p-2 font-normal'>
                            {idx + 1}. {item.question}
                          </td>
                          <td className='text-center border border-black p-2'>
                            {item.SA}
                          </td>
                          <td className='text-center border border-black p-2'>
                            {item.A}
                          </td>
                          <td className='text-center border border-black p-2'>
                            {item.N}
                          </td>
                          <td className='text-center border border-black p-2'>
                            {item.D}
                          </td>
                          <td className='text-center border border-black p-2'>
                            {item.SD}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Combined Chart for Supervisor Feedback */}
                <div className='border'>
                  <div className='mt-16'>
                    <h3 className='text-lg font-medium text-center mb-4'>
                      Training Supervisor&apos;s Feedback
                    </h3>
                    <div style={{ width: '100%', height: 600 }}>
                      <ResponsiveContainer width='100%' height='100%'>
                        <BarChart
                          data={formattedData.supervisor.chartData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 30,
                            bottom: 130, // Increased bottom margin
                          }}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis
                            dataKey='name'
                            height={130} // Increased height for labels
                            tick={
                              <CustomXAxisTick
                                questions={
                                  formattedData.supervisor.questionData
                                }
                              />
                            }
                            interval={0}
                          />
                          <YAxis
                            domain={[0, 180]}
                            ticks={[0, 20, 40, 60, 80, 100, 120, 140, 160, 180]}
                          />
                          <Tooltip />
                          <Legend wrapperStyle={{ bottom: 0, left: 0 }} />
                          <Bar
                            dataKey='SA'
                            fill={chartColors.SA}
                            name='S'
                            barSize={20}
                          />
                          <Bar
                            dataKey='A'
                            fill={chartColors.A}
                            name='A'
                            barSize={20}
                          />
                          <Bar
                            dataKey='N'
                            fill={chartColors.N}
                            name='N'
                            barSize={20}
                          />
                          <Bar
                            dataKey='D'
                            fill={chartColors.D}
                            name='D'
                            barSize={20}
                          />
                          <Bar
                            dataKey='SD'
                            fill={chartColors.SD}
                            name='SD'
                            barSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Unanswered feedback chart */}
          {unansweredChartData && unansweredChartData.length > 0 && (
            <div className='border'>
              <div className='mt-8'>
                <h3 className='text-lg font-medium text-center mb-4'>
                  OJTs Without Feedback Responses
                </h3>
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart
                      data={unansweredChartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 30,
                        bottom: 50,
                      }}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='name' />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey='count'
                        fill='#8884d8'
                        name='Unanswered Count'
                        barSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </SidebarInset>
  );
}
