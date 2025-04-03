import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/ojt')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_authenticated/ojt"!</div>;
}
