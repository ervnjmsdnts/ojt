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
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Download } from 'lucide-react';

export default function SubmissionsTable({
  isPending,
  data,
}: {
  isPending: boolean;
  data?: TemplateSubmission[];
}) {
  return (
    <Table className='h-full'>
      <TableHeader>
        <TableRow>
          <TableHead>Template Name</TableHead>
          <TableHead>Documents</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isPending ? (
          <TableRowSkeleton columnCount={2} />
        ) : (
          data?.map((ojt) => (
            <TableRow key={ojt.template.templateId}>
              <TableCell>{ojt.template.title}</TableCell>
              <TableCell className={cn(ojt.submissions.length > 0 && 'p-0')}>
                {ojt.submissions.length === 0 ? (
                  <p>No submissions</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Submission ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ojt.submissions.map((submission) => (
                        <TableRow key={submission.submissionId}>
                          <TableCell>{submission.submissionId}</TableCell>
                          <TableCell>
                            {format(submission.submissionDate!, 'PPpp')}
                          </TableCell>
                          <TableCell>
                            <Button asChild size='icon'>
                              <Link to={submission.submittedFileUrl}>
                                <Download />
                              </Link>
                            </Button>
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
