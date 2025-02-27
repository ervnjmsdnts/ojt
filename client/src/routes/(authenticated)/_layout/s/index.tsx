import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(authenticated)/_layout/s/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Student Dashboard</div>;
}
