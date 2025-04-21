import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
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
import { updateAppraisalCategories } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const categoriesSchema = z.object({
  categories: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().min(1, 'Category name is required'),
      displayOrder: z.number(),
    }),
  ),
});

type CategoriesSchema = z.infer<typeof categoriesSchema>;

interface CategoryFormProps {
  templateId: number;
  initialCategories: Array<{
    id?: number;
    name: string;
    displayOrder: number;
  }>;
}

export default function CategoryForm({
  templateId,
  initialCategories,
}: CategoryFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<CategoriesSchema>({
    resolver: zodResolver(categoriesSchema),
    defaultValues: {
      categories:
        initialCategories.length > 0
          ? initialCategories
          : [{ name: '', displayOrder: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'categories',
  });

  const { mutate: updateCategories, isPending } = useMutation({
    mutationFn: updateAppraisalCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['appraisal-templates', templateId],
      });
    },
  });

  const onSubmit = (data: CategoriesSchema) => {
    updateCategories({
      templateId,
      categories: data.categories,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <div className='flex justify-between items-center'>
          <h3 className='text-lg font-semibold'>Categories</h3>
          <Button
            type='button'
            onClick={() => append({ name: '', displayOrder: fields.length })}
            variant='outline'
            size='sm'>
            <PlusCircle className='mr-2 h-4 w-4' />
            Add Category
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className='flex gap-4 items-end'>
            <FormField
              control={form.control}
              name={`categories.${index}.name`}
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormLabel>Category {index + 1}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Enter category name' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
              onClick={() => remove(index)}
              className='mb-2'
              disabled={fields.length <= 1}>
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        ))}

        <div className='flex justify-end pt-4'>
          <Button type='submit' disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Save Categories'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
