import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getSingleOJTAdmin } from '@/lib/api';
import { useMemo } from 'react';
import { TemplateSubmission } from '@/lib/types';
import { SidebarInset } from '@/components/ui/sidebar';
import PageHeaderText from '@/components/page-header-text';
import SubmissionsTableAdmin from '@/components/ojt/submissions-table-admin';
export const Route = createFileRoute('/_authenticated/ojt/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { isPending, data } = useQuery({
    queryKey: [`ojt/${id}`],
    queryFn: () => getSingleOJTAdmin({ id: id.toString() }),
    enabled: !!id,
  });

  const templatesAndSubmissions = useMemo(() => {
    if (isPending || !data) return {};

    return {
      pre: data['pre-ojt'] as TemplateSubmission[],
      ojt: data.ojt as TemplateSubmission[],
      post: data['post-ojt'] as TemplateSubmission[],
    };
  }, [isPending, data]);

  const header = useMemo(() => {
    if (isPending || !data) return '';

    return `OJT of ${data.studentName} ${data.className ? `| ${data.className}` : ''}`;
  }, [isPending, data]);

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>{header}</PageHeaderText>
      <div className='flex-1 flex flex-col gap-3 justify-between'>
        <section className='flex-1 flex flex-col gap-2 min-h-0'>
          <h3 className='font-semibold'>Pre-OJT</h3>
          <div className='border rounded-lg flex-1 min-h-0 overflow-y-auto p-2'>
            <SubmissionsTableAdmin
              isPending={isPending}
              data={templatesAndSubmissions.pre}
            />
          </div>
        </section>
        <section className='flex-1 flex flex-col gap-2 min-h-0'>
          <h3 className='font-semibold'>OJT</h3>
          <div className='border rounded-lg flex-1 min-h-0 overflow-y-auto p-2'>
            <SubmissionsTableAdmin
              isPending={isPending}
              data={templatesAndSubmissions.ojt}
            />
          </div>
        </section>
        <section className='flex-1 flex flex-col gap-2 min-h-0'>
          <h3 className='font-semibold'>Post-OJT</h3>
          <div className='border rounded-lg flex-1 min-h-0 overflow-y-auto p-2'>
            <SubmissionsTableAdmin
              isPending={isPending}
              data={templatesAndSubmissions.post}
            />
          </div>
        </section>
      </div>
    </SidebarInset>
  );
}
