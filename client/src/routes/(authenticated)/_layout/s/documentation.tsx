import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/(authenticated)/_layout/s/documentation',
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Student Documentation</div>;
}
