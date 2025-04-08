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
import { TemplateSubmission } from '@/lib/types';
import { cn, toUpperCase } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Download, Eye } from 'lucide-react';
import SubmissionStatusBadge from '../submission-status-badge';
import DoubleClickTooltip from '../double-click-tooltip';
import { useCallback, useState } from 'react';
import { EditableTableCell } from '../editable-table-cell';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateSubmissionRemark,
  updateSubmissionStatus,
  UpdateSubmissionStatus,
} from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export default function SubmissionsTableAdmin({
  isPending,
  data,
}: {
  isPending: boolean;
  data?: TemplateSubmission[];
}) {
  const [editingRowRemark, setEditingRowRemark] = useState<number | null>(null);
  const [editingRowStatus, setEditingRowStatus] = useState<number | null>(null);
  const [updateRemark, setUpdateRemark] = useState('');

  const queryClient = useQueryClient();

  const updateSubmissionRemarkMutation = useMutation({
    mutationFn: updateSubmissionRemark,
  });

  const updateSubmissionStatusMutation = useMutation({
    mutationFn: updateSubmissionStatus,
  });

  const onUpdateRemark = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      data: { submissionId: number; ojtId: number },
    ) => {
      if (e.key === 'Enter') {
        if (!updateRemark) {
          return toast.error('Name cannot be empty');
        }
        updateSubmissionRemarkMutation.mutate(
          { submissionId: data.submissionId, remark: updateRemark },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: [`ojt/${data.ojtId}`],
              });
              setEditingRowRemark(null);
              toast.success('Remark updated successfully');
            },
          },
        );
      }
    },
    [updateRemark],
  );

  const onUpdateStatus = (data: UpdateSubmissionStatus & { ojtId: number }) => {
    updateSubmissionStatusMutation.mutate(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`ojt/${data.ojtId}`] });
        setEditingRowStatus(null);
        toast.success('Submission status updated successfully');
      },
    });
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
              <TableCell>{ojt.template.title}</TableCell>
              <TableCell>{toUpperCase(ojt.template.type)}</TableCell>
              <TableCell className={cn(ojt.submissions.length > 0 && 'p-0')}>
                {ojt.submissions.length === 0 ? (
                  <p>No submissions</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time Submitted</TableHead>
                        <TableHead>
                          <DoubleClickTooltip text='Remark' />
                        </TableHead>
                        <TableHead>
                          <DoubleClickTooltip text='Status' />
                        </TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ojt.submissions.map((submission, index) => (
                        <TableRow key={submission.submissionId}>
                          <TableCell>
                            {format(submission.submissionDate!, 'PPpp')}
                          </TableCell>
                          <EditableTableCell
                            editing={editingRowRemark === index}
                            onToggleEditing={() =>
                              setEditingRowRemark(
                                editingRowRemark === index ? null : index,
                              )
                            }>
                            {editingRowRemark === index ? (
                              <Input
                                defaultValue={submission.submissionRemark ?? ''}
                                onChange={(e) =>
                                  setUpdateRemark(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  onUpdateRemark(e, {
                                    submissionId: submission.submissionId,
                                    ojtId: submission.submissionOJTId,
                                  })
                                }
                                className='w-[200px]'
                              />
                            ) : (
                              submission.submissionRemark
                            )}
                          </EditableTableCell>
                          <EditableTableCell
                            editing={editingRowStatus === index}
                            onToggleEditing={() =>
                              setEditingRowStatus(
                                editingRowStatus === index ? null : index,
                              )
                            }>
                            {editingRowStatus === index ? (
                              <Select
                                defaultValue={submission.submissionStatus}
                                onValueChange={(value) =>
                                  onUpdateStatus({
                                    status: value as
                                      | 'pending'
                                      | 'approved'
                                      | 'resubmit',
                                    submissionId: submission.submissionId,
                                    ojtId: submission.submissionOJTId,
                                  })
                                }>
                                <SelectTrigger className='w-[120px]'>
                                  <SelectValue placeholder='Select status...' />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='pending'>
                                    Pending
                                  </SelectItem>
                                  <SelectItem value='approved'>
                                    Approved
                                  </SelectItem>
                                  <SelectItem value='resubmit'>
                                    Resubmit
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <SubmissionStatusBadge
                                status={submission.submissionStatus}
                              />
                            )}
                          </EditableTableCell>
                          <TableCell>
                            {ojt.template.type === 'form' ? (
                              <Button size='icon'>
                                <Eye />
                              </Button>
                            ) : (
                              submission.submittedFileUrl && (
                                <Button asChild size='icon'>
                                  <Link to={submission.submittedFileUrl}>
                                    <Download />
                                  </Link>
                                </Button>
                              )
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
