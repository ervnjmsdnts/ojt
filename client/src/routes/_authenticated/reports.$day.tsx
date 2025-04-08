import PageHeaderText from '@/components/page-header-text';
import { SidebarInset } from '@/components/ui/sidebar';
import { useReactToPrint } from 'react-to-print';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCurrentOJT, getReports } from '@/lib/api';
import { monthNames } from '@/lib/constants';
import { toUpperCase } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { format, getMonth } from 'date-fns';
import { Loader2, Printer } from 'lucide-react';
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/_authenticated/reports/$day')({
  component: RouteComponent,
});

interface EditableSectionProps {
  label: string;
  name: string;
  value: string;
  isEditing: boolean;
  onToggle: () => void;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

function EditableSection({
  label,
  name,
  value,
  isEditing,
  onToggle,
  onChange,
}: EditableSectionProps) {
  return (
    <div>
      <p className='font-semibold' onDoubleClick={onToggle}>
        {label}
      </p>
      {isEditing ? (
        <Textarea name={name} value={value} onChange={onChange} />
      ) : (
        <p className='indent-8 text-justify whitespace-pre-wrap'>{value}</p>
      )}
    </div>
  );
}

function RouteComponent() {
  const { day } = Route.useParams();
  const { isPending: reportsPending, data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: getReports,
  });

  const { isPending: ojtPending, data: ojt } = useQuery({
    queryKey: ['student-ojt'],
    queryFn: getCurrentOJT,
  });

  const [showContent, setShowContent] = useState({
    introduction: false,
    learningObjects: false,
    accomplishments: false,
    challenges: false,
    reflection: false,
    goals: false,
  });

  const [content, setContent] = useState({
    introduction: '',
    learningObjects: '',
    accomplishments: '',
    challenges: '',
    reflection: '',
    goals: '',
  });

  const onChangeContent = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const monthNumber = parseInt(day, 10);
  const month = monthNames[monthNumber];

  const isPending = useMemo(
    () => reportsPending || ojtPending,
    [reportsPending, ojtPending],
  );

  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    pageStyle: '@media print { @page { size: A4; margin: 200mm !important }}',
  });

  const filteredReports = reports
    ?.filter((report) => {
      return getMonth(new Date(report.date!)) === monthNumber;
    })
    ?.sort((a, b) => a.date! - b.date!);

  const totalHours = filteredReports?.reduce((acc, report) => {
    return acc + (report.numberOfWorkingHours || 0);
  }, 0);

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <PageHeaderText>{toUpperCase(month)} Reports</PageHeaderText>
        <Button onClick={() => reactToPrintFn()}>
          <Printer />
          Print
        </Button>
      </div>
      {isPending ? (
        <div className='w-full h-full flex items-center justify-center'>
          <Loader2 className='w-8 h-8 animate-spin' />
        </div>
      ) : (
        <div className='h-full border p-12 w-full max-w-screen-lg self-center'>
          <div ref={contentRef}>
            <div className='text-center font-bold text-3xl'>
              <h1>Monthly Accomplishment Report</h1>
              <h1>({month})</h1>
            </div>
            <div className='grid gap-8'>
              <div>
                <p>
                  <span className='font-semibold'>Student Trainee: </span>
                  {ojt?.student.fullName}
                </p>
                <p>
                  <span className='font-semibold'>Section: </span>
                  {ojt?.class?.name}
                </p>
                <p>
                  <span className='font-semibold'>Company: </span>
                  {ojt?.company?.name}
                </p>
              </div>
              <div className='grid gap-2'>
                <EditableSection
                  label='I. Introduction'
                  name='introduction'
                  value={content.introduction}
                  isEditing={showContent.introduction}
                  onToggle={() =>
                    setShowContent((prev) => ({
                      ...prev,
                      introduction: !prev.introduction,
                    }))
                  }
                  onChange={onChangeContent}
                />
                <EditableSection
                  label='II. Learning Objectives'
                  name='learningObjects'
                  value={content.learningObjects}
                  isEditing={showContent.learningObjects}
                  onToggle={() =>
                    setShowContent((prev) => ({
                      ...prev,
                      learningObjects: !prev.learningObjects,
                    }))
                  }
                  onChange={onChangeContent}
                />
                <EditableSection
                  label='III. Accomplishments'
                  name='accomplishments'
                  value={content.accomplishments}
                  isEditing={showContent.accomplishments}
                  onToggle={() =>
                    setShowContent((prev) => ({
                      ...prev,
                      accomplishments: !prev.accomplishments,
                    }))
                  }
                  onChange={onChangeContent}
                />
              </div>
              <div className='grid gap-4'>
                <h4 className='text-center text-xl font-bold'>
                  Monthly Work Activities
                </h4>
                <div className='border border-black'>
                  <Table className=''>
                    <TableHeader>
                      <TableRow className='border-black'>
                        <TableHead className='w-[100px] text-black'>
                          Day
                        </TableHead>
                        <TableHead className='w-[200px] text-black'>
                          Date
                        </TableHead>
                        <TableHead className='text-black'>
                          Accomplishments
                        </TableHead>
                        <TableHead className='w-[100px] text-black text-center'>
                          No. of Working Hours
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports?.map((report) => (
                        <TableRow className='border-black' key={report.id}>
                          <TableCell>
                            {format(new Date(report.date!), 'EEEE')}
                          </TableCell>
                          <TableCell>
                            {format(new Date(report.date!), 'PP')}
                          </TableCell>
                          <TableCell className='whitespace-pre-wrap'>
                            {report.accomplishments}
                          </TableCell>
                          <TableCell className='text-center'>
                            {report.numberOfWorkingHours}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter className='bg-white border-black'>
                      <TableRow className='border-black'>
                        <TableCell colSpan={3} className='font-bold text-right'>
                          TOTAL HRS:
                        </TableCell>
                        <TableCell className='text-center'>
                          {totalHours}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
              <div className='grid gap-2'>
                <EditableSection
                  label='IV. Challenges/Problems Encountered'
                  name='challenges'
                  value={content.challenges}
                  isEditing={showContent.challenges}
                  onToggle={() =>
                    setShowContent((prev) => ({
                      ...prev,
                      challenges: !prev.challenges,
                    }))
                  }
                  onChange={onChangeContent}
                />
                <EditableSection
                  label='V. Reflection'
                  name='reflection'
                  value={content.reflection}
                  isEditing={showContent.reflection}
                  onToggle={() =>
                    setShowContent((prev) => ({
                      ...prev,
                      reflection: !prev.reflection,
                    }))
                  }
                  onChange={onChangeContent}
                />
                <EditableSection
                  label='VI. Goals for the Next Month'
                  name='goals'
                  value={content.goals}
                  isEditing={showContent.goals}
                  onToggle={() =>
                    setShowContent((prev) => ({
                      ...prev,
                      goals: !prev.goals,
                    }))
                  }
                  onChange={onChangeContent}
                />
              </div>
            </div>
            <div className='pt-12'>
              <p className='font-semibold'>Certify By:</p>
              <p className='indent-12 pt-24 font-semibold'>
                Name of Trainer/Supervisor
              </p>
            </div>
          </div>
        </div>
      )}
    </SidebarInset>
  );
}
