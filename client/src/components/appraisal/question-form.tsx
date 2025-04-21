import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { updateAppraisalQuestions } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const questionsSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().min(1, 'Question is required'),
    }),
  ),
});

type QuestionsSchema = z.infer<typeof questionsSchema>;

interface QuestionFormProps {
  categoryId: number;
  categoryName: string;
  templateId: number;
  initialQuestions: Array<{
    id?: number;
    question: string;
  }>;
}

export default function QuestionForm({
  categoryId,
  categoryName,
  templateId,
  initialQuestions,
}: QuestionFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<QuestionsSchema>({
    resolver: zodResolver(questionsSchema),
    defaultValues: {
      questions:
        initialQuestions.length > 0
          ? initialQuestions.map((q) => ({ question: q.question }))
          : [{ question: '' }],
    },
  });

  const { fields, append } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const { mutate: updateQuestions, isPending } = useMutation({
    mutationFn: updateAppraisalQuestions,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['appraisal-templates', templateId],
      });
    },
  });

  const onSubmit = (data: QuestionsSchema) => {
    updateQuestions({
      categoryId,
      questions: data.questions.map((q) => q.question),
    });
  };

  return (
    <div className='border p-4 rounded-md mt-4'>
      <h3 className='text-lg font-semibold mb-4'>{categoryName} Questions</h3>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          {fields.map((field, index) => (
            <FormField
              key={field.id}
              control={form.control}
              name={`questions.${index}.question`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question {index + 1}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Enter question' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <div className='flex justify-between pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => append({ question: '' })}>
              <PlusCircle className='mr-2 h-4 w-4' />
              Add Question
            </Button>

            <Button type='submit' disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Questions'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
