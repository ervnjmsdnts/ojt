import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/(authenticated)/_layout/s/company-search',
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Student Company Search</div>;
}
