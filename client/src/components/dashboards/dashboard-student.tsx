import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { SidebarInset } from '../ui/sidebar';
import { getStudentDashboard } from '@/lib/api';
import { Button } from '../ui/button';
import { Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ChatContact } from '@/types/chat';
import { useChat } from '@/context/ChatContext';
import {
  Chat,
  Channel,
  MessageList,
  Window,
  useChannelStateContext,
  MessageInput,
} from 'stream-chat-react';
import 'stream-chat-react/css/v2/index.css';
import { DefaultGenerics, ChannelSort } from 'stream-chat';
import { Input } from '../ui/input';

// Custom channel header for Stream Chat
const CustomChannelHeader = () => {
  const { channel } = useChannelStateContext();

  // Get the current user ID
  const currentUserId = channel?._client?.userID;

  // Find users in the channel
  const users = Object.values(channel?.state?.members || {})
    .filter((member) => member.user)
    .map((member) => member.user);

  // Get the coordinator (the user that is not the current user)
  const coordinatorUser = users.find((user) => user?.id !== currentUserId);

  // Use the coordinator's name and image if available
  const name = coordinatorUser?.name || channel?.data?.name || 'Chat';
  const profilePictureUrl = coordinatorUser?.image || undefined;

  console.log(coordinatorUser);

  return (
    <div className='px-4 py-3 border-b flex items-center gap-2'>
      <Avatar className='h-8 w-8'>
        <AvatarImage src={profilePictureUrl} />
        <AvatarFallback>
          {name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className='text-sm font-medium'>{name}</p>
      </div>
    </div>
  );
};

export default function DashboardStudent({ userId }: { userId: number }) {
  const { isPending, data: dashboard } = useQuery({
    queryFn: getStudentDashboard,
    queryKey: ['dashboard'],
  });

  const [coordinator, setCoordinator] = useState<ChatContact | null>(null);
  const [coordinatorUnreadCount, setCoordinatorUnreadCount] = useState(0);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [isInitializingChannel, setIsInitializingChannel] = useState(false);
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    client,
    connectUser,
    isConnected,
    refreshUnreadCount,
    markChannelRead,
  } = useChat();

  // Connect to Stream Chat
  useEffect(() => {
    if (userId) {
      connectUser(userId)
        .then(() => {
          setIsLoadingChat(false);
        })
        .catch((error) => {
          console.error('Error connecting to Stream Chat:', error);
          setIsLoadingChat(false);
          setError('Failed to connect to chat service');
        });
    } else {
      setIsLoadingChat(false);
    }
  }, [connectUser, userId]);

  // Fetch coordinator (student's chat contact)
  useEffect(() => {
    const fetchCoordinator = async () => {
      try {
        const response = await fetch('/api/chat/contacts');
        if (response.ok) {
          const data = await response.json();
          if (data.contacts && data.contacts.length > 0) {
            setCoordinator(data.contacts[0]); // Student only has one coordinator
          }
        }
      } catch (error) {
        console.error('Failed to fetch coordinator:', error);
        setError('Failed to fetch coordinator');
      }
    };

    fetchCoordinator();
  }, []);

  // Attempt to find existing channel or create a new one when both client and coordinator are available
  useEffect(() => {
    if (!isConnected || !client || !coordinator) return;

    const initializeChannel = async () => {
      setIsInitializingChannel(true);
      setError(null);

      try {
        // First, explicitly create the coordinator user in Stream Chat
        const tokenResponse = await fetch('/api/chat/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: coordinator.id.toString(),
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to get token for the coordinator');
        }

        console.log({ client, coordinator });

        // Get user data
        const userData = await tokenResponse.json();

        // Explicitly create/upsert the user in Stream Chat to ensure they exist
        try {
          await client.upsertUser({
            id: coordinator.id.toString(),
            name: coordinator.fullName,
            role: 'user',
            image: coordinator.profilePictureUrl,
          });

          // Also update current user in case profile image wasn't set properly during connection
          const currentUserResponse = await fetch('/api/chat/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId.toString(),
            }),
          });

          if (currentUserResponse.ok) {
            const currentUserData = await currentUserResponse.json();
            await client.upsertUser({
              id: userId.toString(),
              name: currentUserData.user.name,
              role: currentUserData.user.role,
              image: currentUserData.user.image,
            });
          }
        } catch (err) {
          console.error('Error upserting user:', err);
          // Continue anyway, as the user might already exist
        }

        // Channel ID is created by sorting and joining both user IDs
        const members = [userId.toString(), coordinator.id.toString()].sort();
        const channelId = members.join('-');

        // First, try to query if the channel already exists
        const filter = { id: channelId };
        const sort = { last_message_at: -1 } as ChannelSort<DefaultGenerics>;

        const channels = await client.queryChannels(filter, sort, {
          watch: true,
          state: true,
        });

        if (channels && channels.length > 0) {
          // Channel exists, use it
          const channel = channels[0];
          setActiveChannel(channel);

          // Mark as read when opening
          await markChannelRead(channel.id ?? '');
          setCoordinatorUnreadCount(0);
        } else {
          // Channel doesn't exist, create it
          // First use our backend to establish the relationship
          const response = await fetch('/api/chat/channel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: coordinator.id }),
          });

          if (!response.ok) {
            throw new Error('Failed to initialize chat channel');
          }

          // Then create the channel in Stream
          const channel = client.channel('messaging', channelId, {
            members,
            created_by_id: userId.toString(),
            // Don't set name/subtitle here - let the header component handle displaying the correct info
          });

          console.log('Watching channel...');
          await channel.watch();
          console.log('Channel created and watching');
          setActiveChannel(channel);

          // Mark as read when opening
          await markChannelRead(channel.id ?? '');
          setCoordinatorUnreadCount(0);
        }
      } catch (error) {
        console.error('Error initializing channel:', error);
        setError('Failed to initialize chat. Please try again later.');
      } finally {
        setIsInitializingChannel(false);
      }
    };

    initializeChannel();
  }, [coordinator, client, isConnected, userId, markChannelRead]);

  // Check for unread messages from coordinator
  useEffect(() => {
    if (!client || !isConnected || !coordinator) return;

    const checkUnreadMessages = async () => {
      try {
        // Channel ID is created by sorting and joining both user IDs
        const members = [userId.toString(), coordinator.id.toString()].sort();
        const channelId = members.join('-');

        // Try to query if the channel exists
        const filter = { id: channelId };
        const sort = { last_message_at: -1 } as ChannelSort<DefaultGenerics>;

        const channels = await client.queryChannels(filter, sort, {
          state: true,
        });

        if (channels && channels.length > 0) {
          const channel = channels[0];
          // Get unread count for this channel
          const unreadCount = channel.countUnread();
          setCoordinatorUnreadCount(unreadCount);
        }
      } catch (error) {
        console.error('Error checking unread messages:', error);
      }
    };

    checkUnreadMessages();

    // Listen for new messages to update unread count
    const handleMessageNew = (event: any) => {
      // Only count messages from coordinator, not from current user
      if (event.message.user.id !== userId.toString()) {
        // If not in active channel, increment count
        if (!activeChannel) {
          setCoordinatorUnreadCount((prev) => prev + 1);
        } else {
          // If in active channel, reset count
          setCoordinatorUnreadCount(0);
        }
        // Also refresh global unread count
        refreshUnreadCount();
      }
    };

    client.on('message.new', handleMessageNew);

    return () => {
      client.off('message.new', handleMessageNew);
    };
  }, [
    client,
    isConnected,
    coordinator,
    userId,
    activeChannel,
    refreshUnreadCount,
  ]);

  // Reset unread count when opening channel
  useEffect(() => {
    if (activeChannel) {
      setCoordinatorUnreadCount(0);
      refreshUnreadCount();
    }
  }, [activeChannel, refreshUnreadCount]);

  // Mark messages as read when channel is opened
  useEffect(() => {
    if (activeChannel && isConnected) {
      // Get the channel ID and mark it as read
      const channelId = activeChannel.id;
      if (channelId) {
        console.log('Marking channel as read:', channelId);
        markChannelRead(channelId);
        setCoordinatorUnreadCount(0);
      }
    }
  }, [activeChannel, isConnected, markChannelRead]);

  // Function to retry channel initialization
  const retryInitialization = async () => {
    if (coordinator && client && isConnected) {
      setActiveChannel(null);
      setError(null);
      setIsInitializingChannel(true);

      try {
        // First, explicitly create the coordinator user in Stream Chat
        const tokenResponse = await fetch('/api/chat/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: coordinator.id.toString(),
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to get token for the coordinator');
        }

        // Explicitly create/upsert the user in Stream Chat to ensure they exist
        try {
          await client.upsertUser({
            id: coordinator.id.toString(),
            name: coordinator.fullName,
            role: 'user',
            image: coordinator.profilePictureUrl,
          });

          // Also update current user in case profile image wasn't set properly during connection
          const currentUserResponse = await fetch('/api/chat/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId.toString(),
            }),
          });

          if (currentUserResponse.ok) {
            const currentUserData = await currentUserResponse.json();
            await client.upsertUser({
              id: userId.toString(),
              name: currentUserData.user.name,
              role: currentUserData.user.role,
              image: currentUserData.user.image,
            });
          }
        } catch (err) {
          console.error('Error upserting user:', err);
          // Continue anyway, as the user might already exist
        }

        // Channel ID is created by sorting and joining both user IDs
        const members = [userId.toString(), coordinator.id.toString()].sort();
        const channelId = members.join('-');

        // First, call our backend API to establish the relationship
        const response = await fetch('/api/chat/channel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetUserId: coordinator.id,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to initialize chat channel');
        }

        // Create the channel in Stream
        const channel = client.channel('messaging', channelId, {
          members,
          created_by_id: userId.toString(),
          // Don't set name/subtitle here - let the header component handle displaying the correct info
        });

        console.log('Watching channel...');
        await channel.watch();
        console.log('Channel created and watching');
        setActiveChannel(channel);

        // Mark as read after creating
        await markChannelRead(channel.id ?? '');
        setCoordinatorUnreadCount(0);

        setError(null);
      } catch (error) {
        console.error('Error creating channel:', error);
        setError('Failed to create chat channel. Please try again.');
      } finally {
        setIsInitializingChannel(false);
      }
    }
  };

  return (
    <SidebarInset className='py-4 px-8 flex flex-row gap-4'>
      <div className='w-3/4 flex flex-col gap-4'>
        <div className='grid grid-cols-3 gap-2'>
          <Card>
            <CardHeader>
              <CardTitle>Pre-OJT</CardTitle>
              <CardDescription>Number of Approved Submissions</CardDescription>
            </CardHeader>
            <CardContent className='flex justify-end'>
              {isPending ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <p>
                  {dashboard?.stats.preOjt.approvedSubmissions}/
                  {dashboard?.stats.preOjt.totalRequired}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>OJT</CardTitle>
              <CardDescription>Number of Hours</CardDescription>
            </CardHeader>
            <CardContent className='flex justify-end'>
              {isPending ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <p>
                  {dashboard?.stats.ojt.approvedHours}/
                  {dashboard?.stats.ojt.totalRequired} hrs
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Post-OJT</CardTitle>
              <CardDescription>Number of Approved Submissions</CardDescription>
            </CardHeader>
            <CardContent className='flex justify-end'>
              {isPending ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <p>
                  {dashboard?.stats.postOjt.approvedSubmissions}/
                  {dashboard?.stats.postOjt.totalRequired}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className='h-full'>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className='flex items-center justify-center'>
                <Loader2 className='w-4 h-4 animate-spin' />
              </div>
            ) : (
              <div className='grid gap-2'>
                {dashboard?.notifications.map((notification) => (
                  <div
                    className='border-b py-2 grid gap-1'
                    key={notification.id}>
                    <p className='text-xs text-muted-foreground'>
                      {format(notification.createdAt!, 'PPp')}
                    </p>
                    <p className='text-sm whitespace-pre-wrap'>
                      {notification.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className='w-1/4 flex flex-col gap-4'>
        <Card className='h-2/5 overflow-y-auto'>
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-2'>
            {isPending ? (
              <div className='flex items-center justify-center'>
                <Loader2 className='w-4 h-4 animate-spin' />
              </div>
            ) : (
              dashboard?.links.map((link) => (
                <Button
                  key={link.id}
                  variant='link'
                  className='w-full justify-start p-0 border-b rounded-none'
                  asChild>
                  <a
                    href={
                      link.url.includes('https')
                        ? link.url
                        : `https://${link.url}`
                    }
                    target='_blank'>
                    {link.name}
                  </a>
                </Button>
              ))
            )}
          </CardContent>
        </Card>
        <Card className='h-3/5 flex flex-col'>
          <CardHeader>
            <CardTitle>Chat with Coordinator</CardTitle>
          </CardHeader>
          <CardContent className='p-0 flex flex-col h-0 flex-1'>
            {isLoadingChat ? (
              <div className='flex items-center justify-center h-full'>
                <Loader2 className='w-6 h-6 animate-spin' />
              </div>
            ) : !coordinator ? (
              <div className='flex items-center justify-center h-full text-center p-4'>
                <p className='text-muted-foreground'>
                  No coordinator assigned yet
                </p>
              </div>
            ) : !client ? (
              <div className='flex items-center justify-center h-full text-center p-4'>
                <p className='text-muted-foreground'>
                  Could not initialize chat. Please try again later.
                </p>
              </div>
            ) : error ? (
              <div className='flex items-center justify-center h-full text-center p-4 flex-col gap-2'>
                <p className='text-muted-foreground'>{error}</p>
                <div className='flex items-center gap-2'>
                  <Button
                    size='sm'
                    onClick={retryInitialization}
                    disabled={isInitializingChannel}>
                    {isInitializingChannel ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Connecting...
                      </>
                    ) : (
                      'Try Again'
                    )}
                  </Button>
                  {coordinatorUnreadCount > 0 && (
                    <div className='relative flex size-3'>
                      <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75'></span>
                      <span className='relative inline-flex size-3 rounded-full bg-sky-500'></span>
                    </div>
                  )}
                </div>
              </div>
            ) : isInitializingChannel ? (
              <div className='flex items-center justify-center h-full'>
                <div className='flex flex-col items-center'>
                  <Loader2 className='w-6 h-6 animate-spin mb-2' />
                  <p className='text-sm text-muted-foreground'>
                    Starting conversation...
                  </p>
                </div>
              </div>
            ) : !activeChannel ? (
              <div className='flex items-center justify-center h-full flex-col gap-3'>
                <Button
                  onClick={retryInitialization}
                  className='flex items-center gap-2'>
                  <span>Chat with your coordinator</span>
                  {coordinatorUnreadCount > 0 && (
                    <div className='relative flex size-3'>
                      <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75'></span>
                      <span className='relative inline-flex size-3 rounded-full bg-sky-500'></span>
                    </div>
                  )}
                </Button>
              </div>
            ) : (
              <Chat client={client} theme='messaging light'>
                <Channel channel={activeChannel}>
                  <Window>
                    <CustomChannelHeader />
                    <MessageList />
                    <MessageInput />
                  </Window>
                </Channel>
              </Chat>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
