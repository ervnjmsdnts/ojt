import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/(authenticated)/_layout/s/ojt-requirements',
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Student OJT Requirements</div>;
}
