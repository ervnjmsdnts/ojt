import { Eye } from 'lucide-react';
import { Button } from '../ui/button';

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useState } from 'react';

export default function ViewMemorandumDialog({
  memorandumUrl,
}: {
  memorandumUrl: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size='icon'>
          <Eye />
        </Button>
      </DialogTrigger>
      <DialogContent className='w-[90vw] max-h-[80vh] max-w-none flex flex-col overflow-y-auto h-full'>
        <DialogHeader>
          <DialogTitle>View Memorandum</DialogTitle>
        </DialogHeader>
        <div className='h-full w-full'>
          {memorandumUrl ? (
            <iframe src={memorandumUrl} className='w-full h-full' />
          ) : (
            <p>No Memorandum assigned</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
