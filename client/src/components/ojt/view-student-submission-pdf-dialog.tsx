import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Eye } from 'lucide-react';

export default function ViewStudentSubmissionPDFDialog({
  submissionUrl,
}: {
  submissionUrl: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size='icon'>
          <Eye />
        </Button>
      </DialogTrigger>
      <DialogContent className='w-[90vw] max-h-[80vh] max-w-none flex flex-col overflow-y-auto h-full'>
        <DialogHeader>
          <DialogTitle>View Submission</DialogTitle>
        </DialogHeader>
        <div className='h-full w-full'>
          <iframe src={submissionUrl} className='w-full h-full' />
        </div>
      </DialogContent>
    </Dialog>
  );
}
