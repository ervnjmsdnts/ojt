import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { Plus, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { useState } from 'react';
import { Textarea } from '../ui/textarea';
import {
  createGlobalNotification,
  createStudentNotification,
  getOJTsAdmin,
  getOJTsCoordinator,
} from '@/lib/api';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

const schema = z.object({
  message: z.string().min(1),
  type: z.enum(['global', 'student']),
  studentIds: z.array(z.string()).optional(),
});

type Schema = z.infer<typeof schema>;

type Props = {
  role: 'admin' | 'coordinator' | 'student';
};

export default function AddNotificationDialog({ role }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectValue, setSelectValue] = useState<string>('');
  const queryClient = useQueryClient();
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'global',
    },
  });

  const { data: students } = useQuery({
    queryKey: ['students', role],
    queryFn: role === 'admin' ? getOJTsAdmin : getOJTsCoordinator,
  });

  const createGlobalNotificationMutation = useMutation({
    mutationFn: createGlobalNotification,
  });

  const createStudentNotificationMutation = useMutation({
    mutationFn: createStudentNotification,
  });

  const onSubmit = (data: Schema) => {
    if (data.type === 'global') {
      createGlobalNotificationMutation.mutate(
        { message: data.message },
        {
          onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setOpen(false);
            form.reset();
          },
          onError: (error) => {
            toast.error(error.message);
          },
        },
      );
    } else {
      createStudentNotificationMutation.mutate(
        {
          message: data.message,
          targetStudentIds: selectedStudents.map((s) => Number(s.id)),
        },
        {
          onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setOpen(false);
            setSelectedStudents([]);
            form.reset();
          },
          onError: (error) => {
            toast.error(error.message);
          },
        },
      );
    }
  };

  const notificationType = form.watch('type');

  const handleStudentSelect = (studentId: string) => {
    const student = students?.find((s) => s.id.toString() === studentId);
    if (student && !selectedStudents.some((s) => s.id === studentId)) {
      setSelectedStudents([
        ...selectedStudents,
        {
          id: student.student.id.toString(),
          name: student.student.fullName,
        },
      ]);
      setSelectValue('');
    }
  };

  const handleStudentRemove = (studentId: string) => {
    setSelectedStudents(selectedStudents.filter((s) => s.id !== studentId));
  };

  const availableStudents = students?.filter(
    (student) => !selectedStudents.some((s) => s.id === student.id.toString()),
  );

  const renderSelectedStudent = (
    student: { id: string; name: string },
    showRemove = true,
  ) => (
    <Badge
      key={student.id}
      variant='secondary'
      className='bg-secondary text-secondary-foreground hover:bg-secondary/80'>
      {student.name}
      {showRemove && (
        <button
          type='button'
          onClick={() => handleStudentRemove(student.id)}
          className='ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'>
          <X className='h-3 w-3 text-muted-foreground hover:text-foreground' />
        </button>
      )}
    </Badge>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='icon'>
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Notification</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select notification type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='global'>Global</SelectItem>
                      <SelectItem value='student'>Student Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {notificationType === 'student' && (
              <FormItem>
                <FormLabel>Students</FormLabel>
                {selectedStudents.length > 0 && (
                  <div className='flex flex-wrap gap-2 mb-2'>
                    {selectedStudents
                      .slice(0, 2)
                      .map((student) => renderSelectedStudent(student))}
                    {selectedStudents.length > 2 && (
                      <Popover modal={true}>
                        <PopoverTrigger>
                          <Badge
                            variant='secondary'
                            className='bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer'>
                            +{selectedStudents.length - 2} more
                          </Badge>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-2'>
                          <div className='flex flex-col gap-2'>
                            {selectedStudents.slice(2).map((student) => (
                              <div
                                key={student.id}
                                className='flex items-center gap-2'>
                                {renderSelectedStudent(student)}
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                )}
                <Select value={selectValue} onValueChange={handleStudentSelect}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a student' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableStudents?.map((student) => (
                      <SelectItem
                        key={student.id}
                        value={student.id.toString()}>
                        {student.student.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name='message'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className='justify-end'>
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
