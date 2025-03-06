import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(authenticated)/_layout/s/profile')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Student Profile</div>;
}
