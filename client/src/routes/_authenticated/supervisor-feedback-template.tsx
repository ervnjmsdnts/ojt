import { SidebarInset } from '@/components/ui/sidebar';
import PageHeaderText from '@/components/page-header-text';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormLabel,
  FormItem,
  FormControl,
} from '@/components/ui/form';
import { useEffect } from 'react';
import CreateTemplateDialog from '@/components/supervisor-feedback/create-template-dialog';

export const Route = createFileRoute(
  '/_authenticated/supervisor-feedback-template',
)({
  component: RouteComponent,
});

const updateFeedbackQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
    }),
  ),
});

type UpdateFeedbackQuestionsSchema = z.infer<
  typeof updateFeedbackQuestionsSchema
>;

// API functions for supervisor feedback
async function getSupervisorFeedbackTemplates() {
  const res = await api['supervisor-feedback'].$get();
  if (!res.ok) {
    throw new Error('server error');
  }
  const data = await res.json();
  return data;
}

async function updateSupervisorFeedbackQuestions(data: {
  templateId: number;
  questions: string[];
}) {
  const res = await api['supervisor-feedback'][':id'].questions.$patch({
    json: { questions: data.questions },
    param: { id: data.templateId.toString() },
  });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

function RouteComponent() {
  const queryClient = useQueryClient();

  const { data: template, isLoading } = useQuery({
    queryKey: ['supervisor-feedback-templates'],
    queryFn: getSupervisorFeedbackTemplates,
    staleTime: 0, // Force refetch when navigating back
  });

  const form = useForm<UpdateFeedbackQuestionsSchema>({
    resolver: zodResolver(updateFeedbackQuestionsSchema),
    defaultValues: {
      questions:
        template?.questions?.map((question) => ({
          question: question.question,
        })) || [],
    },
  });

  useEffect(() => {
    if (template?.questions) {
      form.reset({
        questions: template.questions.map((question) => ({
          question: question.question,
        })),
      });
    }
  }, [template, form]);

  const { fields, append } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const { mutate: updateQuestions, isPending: isUpdating } = useMutation({
    mutationFn: updateSupervisorFeedbackQuestions,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['supervisor-feedback-templates'],
      });
    },
  });

  const onSubmit = (data: UpdateFeedbackQuestionsSchema) => {
    if (!template?.id) {
      return;
    }

    updateQuestions({
      templateId: template.id,
      questions: data.questions.map((question) => question.question),
    });
  };

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>Supervisor&apos;s Feedback Form Questions</PageHeaderText>
      {isLoading ? (
        <div>Loading...</div>
      ) : !template ? (
        <div className='flex flex-col gap-4'>
          <div className='flex justify-end'>
            <CreateTemplateDialog />
          </div>
          <div className='text-center text-muted-foreground'>
            No template found
          </div>
        </div>
      ) : (
        <div className='flex flex-col gap-4'>
          <h3 className='text-lg font-semibold'>Version {template.version}</h3>
          <div className='flex justify-between items-center'>
            <p className='text-lg font-semibold'>Questions</p>
            <Button onClick={() => append({ question: '' })}>
              Add Question
            </Button>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`questions.${index}.question`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question {index + 1}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
              <div className='flex pt-4 justify-end'>
                <Button type='submit' disabled={isUpdating}>
                  {isUpdating ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </SidebarInset>
  );
}
