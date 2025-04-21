import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  MoreVerticalIcon,
  Users2,
  ClipboardCheck,
  ClipboardList,
  School,
  GraduationCap,
  Presentation,
  UserPlus,
  BarChart,
  FileText,
} from 'lucide-react';
import React from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { User } from '@server/sharedTypes';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useChat } from '@/context/ChatContext';
import BSULogo from '@/assets/bsu-logo.png';
import { useQueryClient } from '@tanstack/react-query';

export default function AppSidebar({ user }: { user: User }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUnreadCount } = useChat();
  const queryClient = useQueryClient();

  // Get the latest user data from the cache
  const currentUser =
    queryClient.getQueryData<User>(['get-current-user']) || user;

  const items = [
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
      title: 'OJTs',
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
      title: 'Departments',
      url: '/departments',
      icon: School,
      roles: ['coordinator', 'admin'],
    },
    {
      title: 'Programs',
      url: '/programs',
      icon: GraduationCap,
      roles: ['coordinator', 'admin'],
    },
    {
      title: 'Classes',
      url: '/classes',
      icon: Presentation,
      roles: ['coordinator', 'admin'],
    },
    {
      title: 'Form Charts',
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
  ];

  const signOut = async () => {
    await api.auth.logout.$post();
    window.location.reload();
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className='mb-4'>
            <div className='flex items-center gap-2'>
              <img src={BSULogo} alt='BSU Logo' className='w-8' />
              <p className='text-sidebar-foreground/70'>
                Student Internship Portal
              </p>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
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
                              'relative flex size-3 flex items-center justify-between',
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size='lg'>
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarImage
                      src={currentUser.profilePictureUrl || undefined}
                    />
                    <AvatarFallback className='rounded-full bg-gray-200'>
                      <User2 />
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium'>
                      {currentUser.srCode}
                    </span>
                    <span className='truncate text-xs text-muted-foreground'>
                      {currentUser.fullName}
                    </span>
                  </div>
                  <MoreVerticalIcon className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side='top'
                className='w-[--radix-popper-anchor-width]'>
                <DropdownMenuItem onClick={() => navigate({ to: '/profile' })}>
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
