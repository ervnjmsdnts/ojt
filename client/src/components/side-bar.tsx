import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Home,
  Search,
  User2,
  Users2,
  ClipboardCheck,
  ClipboardList,
  School,
  GraduationCap,
  Presentation,
  UserPlus,
  BarChart,
  FileText,
  LogOut,
  CircleHelp,
  University,
} from 'lucide-react';
import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { User } from '@server/sharedTypes';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useChat } from '@/context/ChatContext';
import { useQueryClient } from '@tanstack/react-query';
import Logo from './logo';

export default function AppSidebar({ user }: { user: User }) {
  const location = useLocation();
  const { totalUnreadCount } = useChat();
  const queryClient = useQueryClient();

  // Get the latest user data from the cache
  const currentUser =
    queryClient.getQueryData<User>(['get-current-user']) || user;

  const items = [
    {
      title: 'Profile',
      url: '/profile',
      icon: User2,
      roles: ['student', 'coordinator', 'admin'],
    },
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Home,
      roles: ['student', 'coordinator', 'admin'],
    },
    {
      title: 'Users',
      url: '/users',
      icon: Users2,
      roles: ['admin'],
    },
    {
      title: 'Company Search',
      url: '/company',
      icon: Search,
      roles: ['student', 'coordinator', 'admin'],
    },
    {
      title: currentUser.role === 'student' ? 'Requirements' : 'OJTs',
      url: '/ojt',
      icon: ClipboardCheck,
      roles: ['student', 'coordinator', 'admin'],
    },
    {
      title: 'Reports',
      url: '/reports',
      icon: ClipboardList,
      roles: ['student'],
    },
    {
      title: 'Requirements',
      url: '/templates',
      icon: ClipboardList,
      roles: ['coordinator', 'admin'],
    },
    {
      title: 'Requests',
      url: '/requests',
      icon: UserPlus,
      roles: ['coordinator'],
    },
    {
      title: 'Colleges',
      url: '/colleges',
      icon: University,
      roles: ['admin'],
    },
    {
      title: 'Departments',
      url: '/departments',
      icon: School,
      roles: ['admin'],
    },
    {
      title: 'Programs',
      url: '/programs',
      icon: GraduationCap,
      roles: ['admin'],
    },
    {
      title: 'Classes',
      url: '/classes',
      icon: Presentation,
      roles: ['coordinator', 'admin'],
    },
    {
      title: 'Feedback Summary',
      url: '/form-charts',
      icon: BarChart,
      roles: ['coordinator', 'admin'],
    },
    {
      title: 'Student Feedback Questions',
      url: '/student-feedback-template',
      icon: FileText,
      roles: ['coordinator', 'admin'],
    },
    {
      title: 'Supervisor Feedback Questions',
      url: '/supervisor-feedback-template',
      icon: FileText,
      roles: ['coordinator', 'admin'],
    },
    {
      title: 'Student Feedback Form',
      url: '/student-feedback-form',
      icon: FileText,
      roles: ['student'],
    },
    {
      title: 'Supervisor Feedback',
      url: '/supervisor-feedback-email',
      icon: FileText,
      roles: ['student'],
    },
    {
      title: 'Appraisal Questions',
      url: '/appraisal-template',
      icon: FileText,
      roles: ['admin', 'coordinator'],
    },
    {
      title: 'Appraisal Feedback',
      url: '/appraisal-email',
      icon: FileText,
      roles: ['student'],
    },
    {
      title: 'FAQ',
      url: '/faq',
      icon: CircleHelp,
      roles: ['student', 'coordinator'],
    },
  ];

  const signOut = async () => {
    await api.auth.logout.$post();
    window.location.reload();
  };

  return (
    <Sidebar className='bg-blue-400 text-white'>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className='mb-4'>
            <div className='flex items-center gap-2'>
              <Logo />
              <p className='text-sidebar-foreground/70'>
                Student Internship Portal
              </p>
            </div>
          </SidebarGroupLabel>
          <div className='flex gap-4 pb-4 border-b justify-between w-full'>
            <Avatar className='h-8 w-8 rounded-lg'>
              <AvatarImage src={currentUser.profilePictureUrl || undefined} />
              <AvatarFallback className='rounded-full bg-gray-400'>
                <User2 />
              </AvatarFallback>
            </Avatar>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-medium'>{currentUser.srCode}</span>
              <span className='truncate text-xs text-white'>
                {currentUser.fullName}
              </span>
            </div>
          </div>
          <SidebarGroupContent className='pt-4'>
            <SidebarMenu>
              {items.map((item) => (
                <React.Fragment key={item.url}>
                  {item.roles?.includes(user.role) && (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.url === location.pathname}>
                        <Link
                          to={item.url}
                          className={cn(
                            item.url === '/dashboard' &&
                              'relative flex size-3 items-center justify-between',
                          )}>
                          {item.url === '/dashboard' ? (
                            <div className='flex items-center gap-2'>
                              <item.icon className='size-4' />
                              <span>{item.title}</span>
                            </div>
                          ) : (
                            <>
                              <item.icon />
                              <span>{item.title}</span>
                            </>
                          )}
                          {item.url === '/dashboard' &&
                            totalUnreadCount > 0 && (
                              <div className='relative flex size-3'>
                                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75'></span>
                                <span className='relative inline-flex size-3 rounded-full bg-sky-500'></span>
                              </div>
                            )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </React.Fragment>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={signOut}
                  className='flex items-center gap-2'>
                  <LogOut /> Sign out
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
