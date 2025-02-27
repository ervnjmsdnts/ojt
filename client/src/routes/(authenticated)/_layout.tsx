import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { BookCheck, Files, Home } from 'lucide-react';

export const Route = createFileRoute('/(authenticated)/_layout')({
  component: RouteComponent,
});

type UserRole = 'student' | 'coordinator' | 'admin';

function AppSidebar({ userRole }: { userRole: UserRole }) {
  const items = [
    {
      title: 'Dashboard',
      url:
        userRole === 'student'
          ? '/s'
          : userRole === 'coordinator'
            ? '/c'
            : '/a',
      icon: Home,
      roles: ['student', 'coordinator', 'admin'],
    },
    {
      title: 'Documentation',
      url: '/s/documentation',
      icon: Files,
      roles: ['student', 'coordinator'],
    },
    {
      title: 'Forms',
      url: '/s/forms',
      icon: BookCheck,
      roles: ['student'],
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <>
                  {item.roles?.includes(userRole) && (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function RouteComponent() {
  return (
    <div className='flex gap-4'>
      <SidebarProvider>
        <AppSidebar userRole='student' />
        <main className='p-4'>
          <Outlet />
        </main>
      </SidebarProvider>
    </div>
  );
}
