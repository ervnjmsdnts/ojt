import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(authenticated)/_layout/s/forms')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Student Forms</div>;
}
