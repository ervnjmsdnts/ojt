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
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getCoordinators,
  requestForCoordinator,
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
  '/_authenticated-no-sidebar/assign-coordinator',
)({
  beforeLoad: async ({ context }) => {
    const queryClient = context.queryClient;
    let ojt = null;

    try {
      ojt = await queryClient.fetchQuery(userOJTOptions);
    } catch (error) {
      ojt = null;
    }

    if (ojt && (ojt.coordinatorId || ojt.studentCoordinatorRequestId))
      throw redirect({ to: '/dashboard' });
  },
  component: RouteComponent,
});

const schema = z.object({
  coordinatorId: z.coerce.number(),
});

type Schema = z.infer<typeof schema>;

function RouteComponent() {
  const { isPending, data: coordinators } = useQuery({
    queryKey: ['coordinators'],
    queryFn: getCoordinators,
  });

  const form = useForm<Schema>({ resolver: zodResolver(schema) });

  const requestForCoordinatorMutation = useMutation({
    mutationFn: requestForCoordinator,
  });

  const onSubmit = (data: Schema) => {
    requestForCoordinatorMutation.mutate(data, {
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
          <CardTitle className='text-xl'>Assign Coordinator</CardTitle>
          <CardDescription>
            Choose your coordinator to manage your OJT Requirements
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormField
                control={form.control}
                name='coordinatorId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coordinator</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger disabled={isPending}>
                          <SelectValue placeholder='Select coordinator...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!isPending &&
                          coordinators &&
                          coordinators.map((coordinator) => (
                            <SelectItem
                              key={coordinator.id}
                              value={coordinator.id.toString()}>
                              {coordinator.fullName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className='justify-end'>
              <Button
                disabled={isPending || requestForCoordinatorMutation.isPending}>
                {requestForCoordinatorMutation.isPending && (
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                )}
                Send Request
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
