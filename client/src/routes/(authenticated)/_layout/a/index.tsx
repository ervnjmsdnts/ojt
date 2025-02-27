import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(authenticated)/_layout/a/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Admin</div>;
}
