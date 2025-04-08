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
import { toUpperCase } from '@/lib/utils';
import {
  Download,
  Eye,
  FileUp,
  Loader2,
  SquareArrowUpRight,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Input } from '../ui/input';
import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fileSubmission } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import SubmissionStatusBadge from '../submission-status-badge';

export default function SubmissionTableStudent({
  isPending,
  data,
}: {
  isPending: boolean;
  data?: TemplateSubmission[];
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const fileSubmissionMutation = useMutation({ mutationFn: fileSubmission });

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    templateId: number,
  ) => {
    e.preventDefault();
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

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

  return (
    <Table className='h-full'>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
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
                {ojt.template.type === 'template' ? (
                  <Button variant='link' className='p-0' asChild>
                    <Link target='_blank' to={ojt.template.fileUrl!}>
                      {ojt.template.title}
                      <Download />
                    </Link>
                  </Button>
                ) : (
                  ojt.template.title
                )}
              </TableCell>
              <TableCell>{toUpperCase(ojt.template.type)}</TableCell>
              <TableCell>
                {ojt.submissions.length === 0 &&
                ojt.template.type === 'template' ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={fileSubmissionMutation.isPending}
                        onClick={handleFileSelect}
                        size='icon'>
                        {fileSubmissionMutation.isPending ? (
                          <Loader2 className='w-4 h-4 animate-spin' />
                        ) : (
                          <FileUp />
                        )}
                        <Input
                          type='file'
                          ref={fileInputRef}
                          className='hidden'
                          onChange={(e) =>
                            handleFileChange(e, ojt.template.templateId)
                          }
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload</TooltipContent>
                  </Tooltip>
                ) : ojt.submissions.length === 0 &&
                  ojt.template.type === 'form' ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size='icon' asChild>
                        <Link target='_blank' to={ojt.template.formUrl!}>
                          <SquareArrowUpRight />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Navigate</TooltipContent>
                  </Tooltip>
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
                            {ojt.template.type === 'form' ? (
                              <Button size='icon'>
                                <Eye />
                              </Button>
                            ) : (
                              <div className='flex items-center gap-2'>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button asChild size='icon'>
                                      <Link to={submission.submittedFileUrl!}>
                                        <Download />
                                      </Link>
                                    </Button>
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
                                            'pending'
                                        }
                                        onClick={handleFileSelect}
                                        size='icon'>
                                        {fileSubmissionMutation.isPending ? (
                                          <Loader2 className='w-4 h-4 animate-spin' />
                                        ) : (
                                          <FileUp />
                                        )}
                                        <Input
                                          type='file'
                                          ref={fileInputRef}
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
