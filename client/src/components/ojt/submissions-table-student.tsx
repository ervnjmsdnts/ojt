import { TemplateSubmission } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import TableRowSkeleton from '../table-row-skeleton';
import { Button } from '../ui/button';
import { Link } from '@tanstack/react-router';
import { Download, FileUp, Info, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Input } from '../ui/input';
import { useMemo, createRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fileSubmission, getCurrentOJT } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import SubmissionStatusBadge from '../submission-status-badge';
import ViewStudentSubmissionPDFDialog from './view-student-submission-pdf-dialog';

export default function SubmissionTableStudent({
  isPending,
  data,
}: {
  isPending: boolean;
  data?: TemplateSubmission[];
}) {
  const { isPending: studentOJTPending, data: studentOJT } = useQuery({
    queryKey: ['student-ojt'],
    queryFn: getCurrentOJT,
  });
  const queryClient = useQueryClient();

  // Create a map of refs for each template
  const fileInputRefs = useMemo(() => {
    const refs: Record<number, React.RefObject<HTMLInputElement | null>> = {};
    data?.forEach((ojt) => {
      refs[ojt.template.templateId] = createRef<HTMLInputElement>();
    });
    return refs;
  }, [data]);

  const handleFileSelect = (templateId: number) => {
    fileInputRefs[templateId]?.current?.click();
  };

  const fileSubmissionMutation = useMutation({ mutationFn: fileSubmission });

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    templateId: number,
  ) => {
    e.preventDefault();
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast.error('File must be a PDF');
      return;
    }

    fileSubmissionMutation.mutate(
      { templateId, file: selectedFile },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['student-ojt'] });
          toast.success('File submitted successfully');
        },
        onError: (error) => {
          console.log(error);
          toast.error('Failed to submit file');
        },
        onSettled: () => {
          e.target.value = '';
        },
      },
    );
  };

  const canSubmitOJT = ['ojt', 'pre-ojt'].includes(studentOJT?.ojtStatus ?? '');
  const canSubmitPostOJT = ['pre-ojt', 'ojt', 'post-ojt'].includes(
    studentOJT?.ojtStatus ?? '',
  );

  const canSubmit = (category: string) => {
    if (!studentOJT?.ojtStatus) return false;

    const statusOrder = ['pre-ojt', 'ojt', 'post-ojt'];
    const currentStatusIndex = statusOrder.indexOf(studentOJT.ojtStatus);
    const categoryIndex = statusOrder.indexOf(category);

    // Allow submission if the category is the current status or any previous status
    return categoryIndex <= currentStatusIndex;
  };

  return (
    <Table className='h-full'>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Submissions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isPending ? (
          <TableRowSkeleton columnCount={3} />
        ) : (
          data?.map((ojt) => (
            <TableRow key={ojt.template.templateId}>
              <TableCell>
                {ojt.template.fileUrl ? (
                  <Button variant='link' className='p-0' asChild>
                    <Link target='_blank' to={ojt.template.fileUrl}>
                      {ojt.template.title}
                      <Download />
                    </Link>
                  </Button>
                ) : (
                  ojt.template.title
                )}
              </TableCell>
              <TableCell>
                {ojt.submissions.length === 0 ? (
                  !ojt.template.isEmailToSupervisor && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          disabled={
                            fileSubmissionMutation.isPending ||
                            studentOJTPending ||
                            !canSubmit(ojt.template.category)
                          }
                          onClick={() =>
                            handleFileSelect(ojt.template.templateId)
                          }
                          size='icon'>
                          {fileSubmissionMutation.isPending ? (
                            <Loader2 className='w-4 h-4 animate-spin' />
                          ) : (
                            <FileUp />
                          )}
                          <Input
                            type='file'
                            accept='application/pdf'
                            ref={fileInputRefs[ojt.template.templateId]}
                            className='hidden'
                            onChange={(e) =>
                              handleFileChange(e, ojt.template.templateId)
                            }
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Upload</TooltipContent>
                    </Tooltip>
                  )
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time Submitted</TableHead>
                        <TableHead>Remark</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ojt.submissions.map((submission, index) => (
                        <TableRow key={submission.submissionId}>
                          <TableCell>
                            {format(submission.submissionDate!, 'PPpp')}
                          </TableCell>
                          <TableCell>{submission.submissionRemark}</TableCell>
                          <TableCell>
                            <SubmissionStatusBadge
                              status={submission.submissionStatus}
                            />
                          </TableCell>
                          <TableCell>
                            {submission.supervisorFeedbackResponseId ||
                            submission.appraisalResponseId ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size='icon'>
                                    <Info className='w-4 h-4' />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Only coordinator can view the feedback
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <div className='flex items-center gap-2'>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <ViewStudentSubmissionPDFDialog
                                      submissionUrl={
                                        submission.submittedFileUrl!
                                      }
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>Download</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    {index === ojt.submissions.length - 1 && (
                                      <Button
                                        disabled={
                                          fileSubmissionMutation.isPending ||
                                          submission.submissionStatus ===
                                            'approved' ||
                                          submission.submissionStatus ===
                                            'pending' ||
                                          studentOJTPending ||
                                          !canSubmit(ojt.template.category)
                                        }
                                        onClick={() =>
                                          handleFileSelect(
                                            ojt.template.templateId,
                                          )
                                        }
                                        size='icon'>
                                        {fileSubmissionMutation.isPending ? (
                                          <Loader2 className='w-4 h-4 animate-spin' />
                                        ) : (
                                          <FileUp />
                                        )}
                                        <Input
                                          type='file'
                                          ref={
                                            fileInputRefs[
                                              ojt.template.templateId
                                            ]
                                          }
                                          accept='application/pdf'
                                          className='hidden'
                                          onChange={(e) =>
                                            handleFileChange(
                                              e,
                                              ojt.template.templateId,
                                            )
                                          }
                                        />
                                      </Button>
                                    )}
                                  </TooltipTrigger>
                                  <TooltipContent>Upload</TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
