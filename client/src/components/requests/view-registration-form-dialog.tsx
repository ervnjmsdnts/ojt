import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Eye } from 'lucide-react';

export default function ViewRegistrationFormDialog({
  registrationFormUrl,
}: {
  registrationFormUrl: string | null;
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
          {registrationFormUrl ? (
            <iframe src={registrationFormUrl} className='w-full h-full' />
          ) : (
            <div className='flex items-center justify-center h-[300px] text-muted-foreground'>
              No registration form available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
