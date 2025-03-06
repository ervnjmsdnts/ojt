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
import { BookCheck, ExternalLink, Home, Search, User } from 'lucide-react';
import React from 'react';

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
      title: 'Profile',
      url: '/s/profile',
      icon: User,
      roles: ['student', 'coordinator', 'admin'],
    },
    {
      title: 'Company Search',
      url: '/s/company-search',
      icon: Search,
      roles: ['student', 'coordinator', 'admin'],
    },
    {
      title: 'OJT Requirements',
      url: '/s/ojt-requirements',
      icon: BookCheck,
      roles: ['student', 'coordinator', 'admin'],
    },
    {
      title: 'Links',
      url: '/s/links',
      icon: ExternalLink,
      roles: ['student', 'coordinator', 'admin'],
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Student Internship Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <React.Fragment key={item.url}>
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
                </React.Fragment>
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
