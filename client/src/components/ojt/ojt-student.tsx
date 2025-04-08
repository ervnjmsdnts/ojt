import { useQuery } from '@tanstack/react-query';
import PageHeaderText from '../page-header-text';
import { SidebarInset } from '../ui/sidebar';
import { getCurrentOJT } from '@/lib/api';
import { useMemo } from 'react';
import { TemplateSubmission } from '@/lib/types';
import SubmissionsTableStudent from './submissions-table-student';

export default function OJTStudent() {
  const { isPending, data } = useQuery({
    queryKey: ['student-ojt'],
    queryFn: getCurrentOJT,
  });

  const templatesAndSubmissions = useMemo(() => {
    if (isPending || !data) return {};

    return {
      pre: data['pre-ojt'] as TemplateSubmission[],
      ojt: data.ojt as TemplateSubmission[],
      post: data['post-ojt'] as TemplateSubmission[],
    };
  }, [isPending, data]);

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>OJT Requirements</PageHeaderText>
      <div className='flex-1 flex flex-col gap-3 justify-between'>
        <section className='flex-1 flex flex-col gap-2 min-h-0'>
          <h3 className='font-semibold'>Pre-OJT</h3>
          <div className='border rounded-lg flex-1 min-h-0 overflow-y-auto p-2'>
            <SubmissionsTableStudent
              isPending={isPending}
              data={templatesAndSubmissions.pre}
            />
          </div>
        </section>
        <section className='flex-1 flex flex-col gap-2 min-h-0'>
          <h3 className='font-semibold'>OJT</h3>
          <div className='border rounded-lg flex-1 min-h-0 overflow-y-auto p-2'>
            <SubmissionsTableStudent
              isPending={isPending}
              data={templatesAndSubmissions.ojt}
            />
          </div>
        </section>
        <section className='flex-1 flex flex-col gap-2 min-h-0'>
          <h3 className='font-semibold'>Post-OJT</h3>
          <div className='border rounded-lg flex-1 min-h-0 overflow-y-auto p-2'>
            <SubmissionsTableStudent
              isPending={isPending}
              data={templatesAndSubmissions.post}
            />
          </div>
        </section>
      </div>
    </SidebarInset>
  );
}
