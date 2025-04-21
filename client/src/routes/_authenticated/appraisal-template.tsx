import { SidebarInset } from '@/components/ui/sidebar';
import PageHeaderText from '@/components/page-header-text';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
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
  FormMessage,
} from '@/components/ui/form';
import { useEffect, useState } from 'react';
import CreateAppraisalTemplateDialog from '@/components/appraisal/create-template-dialog';
import {
  getAppraisalTemplates,
  updateAppraisalCategories,
  updateAppraisalQuestions,
} from '@/lib/api';

export const Route = createFileRoute('/_authenticated/appraisal-template')({
  component: RouteComponent,
});

const categorySchema = z.object({
  categories: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().min(1, 'Category name is required'),
      displayOrder: z.number(),
    }),
  ),
});

type CategorySchema = z.infer<typeof categorySchema>;

function RouteComponent() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { data: template, isLoading } = useQuery({
    queryKey: ['appraisal-templates'],
    queryFn: getAppraisalTemplates,
    staleTime: 0, // Force refetch when navigating back
  });

  const categoryForm = useForm<CategorySchema>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      categories: template?.categories?.length
        ? template.categories
        : [{ name: '', displayOrder: 0 }],
    },
  });

  const {
    fields: categoryFields,
    append: appendCategory,
    remove: removeCategory,
  } = useFieldArray({
    control: categoryForm.control,
    name: 'categories',
  });

  // Update form when template data changes
  useEffect(() => {
    if (template?.categories) {
      categoryForm.reset({
        categories: template.categories.map((category) => ({
          id: category.id,
          name: category.name,
          displayOrder: category.displayOrder,
        })),
      });
    }
  }, [template, categoryForm]);

  // For questions in the selected category
  const questionSchema = z.object({
    questions: z.array(
      z.object({
        question: z.string().min(1, 'Question is required'),
      }),
    ),
  });

  type QuestionSchema = z.infer<typeof questionSchema>;

  const questionForm = useForm<QuestionSchema>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questions: [{ question: '' }],
    },
  });

  const { fields: questionFields, append: appendQuestion } = useFieldArray({
    control: questionForm.control,
    name: 'questions',
  });

  // Update questions when selected category changes
  useEffect(() => {
    if (selectedCategory && template?.categories) {
      const category = template.categories.find(
        (c) => c.id === selectedCategory,
      );
      if (category?.questions) {
        questionForm.reset({
          questions: category.questions.map((q) => ({ question: q.question })),
        });
      } else {
        questionForm.reset({
          questions: [{ question: '' }],
        });
      }
    }
  }, [selectedCategory, template, questionForm]);

  const { mutate: updateCategories, isPending: isCategoryUpdating } =
    useMutation({
      mutationFn: updateAppraisalCategories,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['appraisal-templates'],
        });
      },
    });

  const { mutate: updateQuestions, isPending: isQuestionUpdating } =
    useMutation({
      mutationFn: updateAppraisalQuestions,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['appraisal-templates'],
        });
      },
    });

  const onCategorySubmit = (data: CategorySchema) => {
    if (!template?.id) return;

    updateCategories({
      templateId: template.id,
      categories: data.categories,
    });
  };

  const onQuestionSubmit = (data: QuestionSchema) => {
    if (!selectedCategory) return;

    updateQuestions({
      categoryId: selectedCategory,
      questions: data.questions.map((q) => q.question),
    });
  };

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>Student Appraisal Form</PageHeaderText>
      {isLoading ? (
        <div>Loading...</div>
      ) : !template ? (
        <div className='flex flex-col gap-4'>
          <div className='flex justify-end'>
            <CreateAppraisalTemplateDialog />
          </div>
          <div className='text-center text-muted-foreground'>
            No template found
          </div>
        </div>
      ) : (
        <div className='flex flex-col gap-6'>
          <h3 className='text-lg font-semibold'>Version {template.version}</h3>

          {/* Categories Section */}
          <div className='flex flex-col gap-4 border-b pb-6'>
            <div className='flex justify-between items-center'>
              <p className='text-lg font-semibold'>Categories</p>
              <Button
                onClick={() =>
                  appendCategory({
                    name: '',
                    displayOrder: categoryFields.length,
                  })
                }>
                Add Category
              </Button>
            </div>

            <Form {...categoryForm}>
              <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)}>
                {categoryFields.map((field, index) => (
                  <div key={field.id} className='flex gap-4 items-end mb-4'>
                    <FormField
                      control={categoryForm.control}
                      name={`categories.${index}.name`}
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <FormLabel>Category {index + 1}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={categoryForm.control}
                      name={`categories.${index}.displayOrder`}
                      render={({ field }) => (
                        <FormItem className='w-24'>
                          <FormLabel>Order</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => removeCategory(index)}
                      className='mb-2'
                      disabled={categoryFields.length <= 1}>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                <div className='flex pt-4 justify-end'>
                  <Button type='submit' disabled={isCategoryUpdating}>
                    {isCategoryUpdating ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      'Save Categories'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Questions Section */}
          <div className='flex flex-col gap-4'>
            <div className='flex justify-between items-center'>
              <p className='text-lg font-semibold'>Questions</p>
              {template.categories && template.categories.length > 0 && (
                <div className='flex items-center gap-2'>
                  <span>Select Category:</span>
                  <select
                    className='border rounded p-1'
                    value={selectedCategory || ''}
                    onChange={(e) =>
                      setSelectedCategory(Number(e.target.value))
                    }>
                    <option value=''>Select a category</option>
                    {template.categories
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {selectedCategory ? (
              <Form {...questionForm}>
                <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)}>
                  {questionFields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={questionForm.control}
                      name={`questions.${index}.question`}
                      render={({ field }) => (
                        <FormItem className='mb-4'>
                          <FormLabel>Question {index + 1}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  <div className='flex pt-4 justify-between'>
                    <Button
                      type='button'
                      onClick={() => appendQuestion({ question: '' })}
                      variant='outline'>
                      <PlusCircle className='mr-2 h-4 w-4' />
                      Add Question
                    </Button>
                    <Button type='submit' disabled={isQuestionUpdating}>
                      {isQuestionUpdating ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        'Save Questions'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className='text-center text-muted-foreground p-4 border rounded'>
                {template.categories && template.categories.length > 0
                  ? 'Please select a category to manage its questions'
                  : 'Create categories first before adding questions'}
              </div>
            )}
          </div>
        </div>
      )}
    </SidebarInset>
  );
}
