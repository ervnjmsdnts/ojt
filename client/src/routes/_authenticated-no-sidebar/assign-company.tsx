import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  assignCompany,
  getCompaniesWithCount,
  userOJTOptions,
} from '@/lib/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export const Route = createFileRoute(
  '/_authenticated-no-sidebar/assign-company',
)({
  beforeLoad: async ({ context }) => {
    const queryClient = context.queryClient;
    let ojt = null;

    try {
      ojt = await queryClient.fetchQuery(userOJTOptions);
    } catch (error) {
      ojt = null;
    }

    if (ojt && ojt.companyId) throw redirect({ to: '/dashboard' });
  },
  component: RouteComponent,
});

const schema = z.object({
  companyId: z.coerce.number(),
  supervisorEmail: z.string().email(),
  supervisorName: z.string().min(1),
  supervisorContactNumber: z.string().min(1),
  supervisorAddress: z.string().min(1),
  totalOJTHours: z.coerce.number(),
});

type Schema = z.infer<typeof schema>;

function RouteComponent() {
  const { isPending, data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompaniesWithCount,
  });

  const form = useForm<Schema>({ resolver: zodResolver(schema) });

  const assignCompanyMutation = useMutation({
    mutationFn: assignCompany,
  });

  const onSubmit = (data: Schema) => {
    assignCompanyMutation.mutate(data, {
      onSuccess: (data) => {
        toast.success(data.message);
        window.location.reload();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };
  return (
    <div className='flex items-center justify-center h-full'>
      <Card className='max-w-md w-full'>
        <CardHeader>
          <CardTitle className='text-xl'>Select Company</CardTitle>
          <CardDescription>
            Choose the company that you have applied to
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormField
                control={form.control}
                name='companyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger disabled={isPending}>
                          <SelectValue placeholder='Select company...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!isPending &&
                          companies &&
                          companies.map((company) => (
                            <SelectItem
                              key={company.id}
                              value={company.id.toString()}>
                              {company.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='totalOJTHours'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total OJT Hours</FormLabel>
                    <FormControl>
                      <Input type='number' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div>
                <h3 className='text-lg font-semibold pt-4 pb-2'>
                  Supervisor Information
                </h3>
                <FormField
                  control={form.control}
                  name='supervisorEmail'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='supervisorName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='supervisorContactNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='supervisorAddress'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className='justify-end'>
              <Button disabled={isPending || assignCompanyMutation.isPending}>
                {assignCompanyMutation.isPending && (
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                )}
                Submit
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
