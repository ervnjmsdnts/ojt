import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(authenticated)/_layout/s/links')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Student Links</div>;
}
