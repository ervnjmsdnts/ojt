import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { useState } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReport } from '@/lib/api';
import { toast } from 'sonner';

const schema = z.object({
  date: z.coerce.date(),
  workingHours: z.coerce.number().min(1),
  accomplishments: z.string().min(1),
});

type Schema = z.infer<typeof schema>;

export default function AddDailyReportDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<Schema>({ resolver: zodResolver(schema) });

  const queryClient = useQueryClient();

  const createReportMutation = useMutation({ mutationFn: createReport });

  const onSubmit = (data: Schema) => {
    createReportMutation.mutate(data, {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        setOpen(false);
      },
      onError: (error) => {
        console.log(error);
        toast.error('Something went wrong');
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Daily Report</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Daily Report</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='date'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Date of birth</FormLabel>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}>
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='workingHours'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. of Working Hours</FormLabel>
                  <FormControl>
                    <Input type='number' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='accomplishments'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accomplishments</FormLabel>
                  <FormControl>
                    <Textarea className='resize-none' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className='justify-end pt-4'>
              <DialogClose asChild>
                <Button type='button' variant='outline'>
                  Close
                </Button>
              </DialogClose>
              <Button type='submit'>Submit</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
