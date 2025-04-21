import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createAppraisalTemplate, getTemplates } from '@/lib/api';
import { Form, FormField, FormItem, FormLabel, FormControl } from '../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export default function CreateAppraisalTemplateDialog() {
  const queryClient = useQueryClient();

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates,
  });

  const form = useForm<{ formTemplateId: number }>({
    resolver: zodResolver(z.object({ formTemplateId: z.coerce.number() })),
  });

  const { mutate: createTemplate, isPending: isCreating } = useMutation({
    mutationFn: createAppraisalTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['appraisal-templates'],
      });
    },
  });

  const onSubmit = (data: { formTemplateId: number }) => {
    createTemplate(data);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create Template</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Appraisal Template</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='formTemplateId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger disabled={isLoadingTemplates}>
                        <SelectValue placeholder='Select a template' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!isLoadingTemplates &&
                        templates &&
                        templates?.map((template) => (
                          <SelectItem
                            key={template.id}
                            value={template.id.toString()}>
                            {template.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <div className='flex justify-end mt-4'>
              <Button type='submit' disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
