import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(authenticated)/_layout/c/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Coordinator</div>;
}
