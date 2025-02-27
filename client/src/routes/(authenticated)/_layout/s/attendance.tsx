import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(authenticated)/_layout/s/attendance')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Student Attendance</div>;
}
