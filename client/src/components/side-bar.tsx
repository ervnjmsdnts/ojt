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
import { Avatar, AvatarFallback } from './ui/avatar';
import { api } from '@/lib/api';

export default function AppSidebar({ user }: { user: User }) {
  const navigate = useNavigate();
  const location = useLocation();
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
      title: 'OJT Requirements',
      url: '/ojt',
      icon: ClipboardCheck,
      roles: ['student', 'coordinator', 'admin'],
    },
    {
      title: 'Templates',
      url: '/templates',
      icon: ClipboardList,
      roles: ['coordinator', 'admin'],
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
          <SidebarGroupLabel>Student Internship Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <React.Fragment key={item.url}>
                  {item.roles?.includes(user.role) && (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.url === location.pathname}>
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size='lg'>
                  <Avatar className='h-8 w-8 rounded-lg grayscale'>
                    <AvatarFallback className='rounded-full bg-gray-200'>
                      <User2 />
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium'>{user.srCode}</span>
                    <span className='truncate text-xs text-muted-foreground'>
                      {user.fullName}
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
