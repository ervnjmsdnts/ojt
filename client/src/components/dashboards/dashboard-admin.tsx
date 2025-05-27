import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SidebarInset } from '../ui/sidebar';
import { getAdminDashboard, getCoordinatorDashboard } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '../ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import TableRowSkeleton from '../table-row-skeleton';
import { Button } from '../ui/button';
import AddLinkDialog from './add-link-dialog';
import AddNotificationDialog from './add-notification-dialog';
import { ChevronLeft, Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
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

// Custom message input component using shadcn UI
const CustomMessageInput = () => {
  const { channel } = useChannelStateContext();
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      channel.sendMessage({
        text: message,
      });
      setMessage('');
    }
  };

  return (
    <div className='px-4 py-3 border-t'>
      <form onSubmit={handleSubmit} className='flex items-center gap-2'>
        <Input
          placeholder='Type a message...'
          className='rounded-full'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button type='submit' size='icon' disabled={!message.trim()}>
          <Send className='h-4 w-4' />
        </Button>
      </form>
    </div>
  );
};

// Custom message component for Stream Chat
const CustomChannelHeader = ({
  onBackClick,
  name,
}: {
  onBackClick: () => void;
  name: string;
}) => {
  return (
    <div className='px-4 py-3 border-b flex items-center gap-2'>
      <Button
        variant='ghost'
        size='icon'
        onClick={onBackClick}
        className='h-8 w-8'>
        <ChevronLeft className='h-4 w-4' />
      </Button>
      <p className='text-sm font-medium'>{name}</p>
    </div>
  );
};

// Add new type for enhanced contacts with unread counts
type EnhancedContact = ChatContact & {
  unreadCount: number;
};

export default function DashboardAdmin({
  role,
  userId,
}: {
  role: 'student' | 'coordinator' | 'admin';
  userId: number;
}) {
  const isAdmin = role === 'admin';
  const isCoordinator = role === 'coordinator';
  const [contacts, setContacts] = useState<EnhancedContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(
    null,
  );
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [isInitializingChannel, setIsInitializingChannel] = useState(false);
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showContactsList, setShowContactsList] = useState(true);

  const {
    client,
    connectUser,
    isConnected,
    markChannelRead,
    refreshUnreadCount,
  } = useChat();

  const { isPending: ojtsAdminPending, data: ojtsAdmin } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getAdminDashboard,
    enabled: isAdmin,
  });
  const { isPending: ojtsCoordinatorPending, data: ojtsCoordinator } = useQuery(
    {
      queryKey: ['dashboard'],
      queryFn: getCoordinatorDashboard,
      enabled: isCoordinator,
    },
  );

  const dashboard = isCoordinator ? ojtsCoordinator : ojtsAdmin;
  const isPending = isCoordinator ? ojtsCoordinatorPending : ojtsAdminPending;

  const [searchQuery, setSearchQuery] = useState('');

  // Connect to Stream Chat
  useEffect(() => {
    if (isCoordinator && userId) {
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
  }, [connectUser, isCoordinator, userId]);

  // Fetch chat contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (isCoordinator) {
        try {
          const response = await fetch('/api/chat/contacts');
          if (response.ok) {
            const data = await response.json();

            // Initialize contacts with unread counts
            const enhancedContacts = data.contacts.map(
              (contact: ChatContact) => ({
                ...contact,
                unreadCount: 0,
              }),
            );

            setContacts(enhancedContacts);

            // If client is connected, check for unread messages for each contact
            if (client && isConnected) {
              checkUnreadMessagesForContacts(enhancedContacts);
            }
          }
        } catch (error) {
          console.error('Failed to fetch chat contacts:', error);
          setError('Failed to fetch student contacts');
        }
      }
    };

    fetchContacts();
  }, [isCoordinator, client, isConnected]);

  // Check for unread messages when client connection changes
  useEffect(() => {
    if (client && isConnected && contacts.length > 0) {
      checkUnreadMessagesForContacts(contacts);
    }
  }, [client, isConnected]);

  // Function to check unread messages for all contacts
  const checkUnreadMessagesForContacts = async (
    contactsList: EnhancedContact[],
  ) => {
    try {
      for (const contact of contactsList) {
        // Channel ID is created by sorting and joining both user IDs
        const members = [userId.toString(), contact.id.toString()].sort();
        const channelId = members.join('-');

        // Try to query if the channel exists
        const filter = { id: channelId };
        const sort = { last_message_at: -1 } as ChannelSort<DefaultGenerics>;

        const channels = await client?.queryChannels(filter, sort, {
          state: true,
        });

        if (channels && channels.length > 0) {
          const channel = channels[0];
          // Get unread count for this channel
          const unreadCount = channel.countUnread();

          // Update the contact with unread count
          setContacts((prev) =>
            prev.map((c) => (c.id === contact.id ? { ...c, unreadCount } : c)),
          );
        }
      }
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  };

  // Update contacts list to mark messages as read when a channel is selected
  useEffect(() => {
    if (activeChannel && selectedContact) {
      // Mark this contact's messages as read
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === selectedContact.id
            ? { ...contact, unreadCount: 0 }
            : contact,
        ),
      );
    }
  }, [activeChannel, selectedContact]);

  // Handle new message events to update unread counts
  useEffect(() => {
    if (client && isConnected) {
      const handleMessageNew = (event: any) => {
        const { message, channel } = event;

        // Only count messages from others, not from current user
        if (message.user.id !== userId.toString() && channel.id) {
          // Parse channel ID to find the other user's ID
          const memberIds = channel.id.split('-');
          const otherUserId = memberIds.find(
            (id: string) => id !== userId.toString(),
          );

          if (otherUserId && !activeChannel) {
            // Update unread count for this contact
            setContacts((prev) =>
              prev.map((contact) =>
                contact.id.toString() === otherUserId
                  ? { ...contact, unreadCount: contact.unreadCount + 1 }
                  : contact,
              ),
            );
          }
        }
      };

      // Subscribe to message.new event
      client.on('message.new', handleMessageNew);

      return () => {
        // Unsubscribe when component unmounts
        client.off('message.new', handleMessageNew);
      };
    }
  }, [client, isConnected, activeChannel, userId]);

  // Mark messages as read when channel is opened
  useEffect(() => {
    if (activeChannel && isConnected) {
      // Get the channel ID and mark it as read
      const channelId = activeChannel.id;
      if (channelId) {
        console.log('Marking channel as read:', channelId);
        markChannelRead(channelId);

        // Also update local state to reflect read status
        if (selectedContact) {
          setContacts((prev) =>
            prev.map((contact) =>
              contact.id === selectedContact.id
                ? { ...contact, unreadCount: 0 }
                : contact,
            ),
          );
        }
      }
    }
  }, [activeChannel, isConnected, markChannelRead, selectedContact]);

  // Function to handle contact selection and initialize channel
  const handleContactSelection = async (contact: ChatContact) => {
    if (!client || !isConnected) {
      setError('Chat client not connected');
      return;
    }

    setSelectedContact(contact);
    setIsInitializingChannel(true);
    setError(null);

    try {
      console.log(
        `Initializing channel with student: ${contact.fullName} (ID: ${contact.id})`,
      );

      // First, explicitly create the student user in Stream Chat via our backend
      console.log('Explicitly creating student user in Stream Chat...');
      const createUserResponse = await fetch('/api/chat/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: contact.id.toString(),
        }),
      });

      if (!createUserResponse.ok) {
        const errorText = await createUserResponse.text();
        console.error('Failed to create user in Stream Chat:', errorText);
        throw new Error(`Failed to create user in Stream Chat: ${errorText}`);
      }

      const userData = await createUserResponse.json();
      console.log('User created successfully:', userData);

      // Channel ID is created by sorting and joining both user IDs
      const members = [userId.toString(), contact.id.toString()].sort();
      const channelId = members.join('-');
      console.log(`Generated channel ID: ${channelId}`);

      // Now create the channel via our backend
      console.log('Creating channel via backend...');
      const response = await fetch('/api/chat/channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: contact.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend channel creation failed:', errorText);
        throw new Error(
          `Failed to initialize chat channel: ${errorText || 'Unknown error'}`,
        );
      }

      console.log('Backend relationship established successfully');

      // Now try to query if the channel already exists in Stream Chat
      const filter = { id: channelId };
      const sort = { last_message_at: -1 } as ChannelSort<DefaultGenerics>;

      console.log('Querying for channel in Stream Chat...');
      const channels = await client.queryChannels(filter, sort, {
        watch: true,
        state: true,
      });

      if (channels && channels.length > 0) {
        // Channel exists, use it
        console.log('Found existing channel in Stream Chat, using it');
        const channel = channels[0];
        setActiveChannel(channel);
        setShowContactsList(false);

        // Mark as read when selecting
        await markChannelRead(channel.id ?? '');
      } else {
        // Channel doesn't exist in Stream Chat yet, create it
        console.log('Creating new channel in Stream Chat...');
        // Then create the channel in Stream
        const channel = client.channel('messaging', channelId, {
          members,
          name: `${contact.fullName}`,
          subtitle: contact.srCode,
        });

        console.log('Watching channel...');
        await channel.watch();
        console.log('Channel created and watching');
        setActiveChannel(channel);
        setShowContactsList(false);
      }

      // Mark messages as read when selecting this contact
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, unreadCount: 0 } : c)),
      );
    } catch (error: any) {
      console.error('Error initializing channel:', error);
      setError(
        `Failed to initialize chat: ${error.message || 'Unknown error'}`,
      );
      setActiveChannel(null);
    } finally {
      setIsInitializingChannel(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to retry channel initialization
  const retryInitialization = async () => {
    if (selectedContact && client && isConnected) {
      setActiveChannel(null);
      setError(null);
      setIsInitializingChannel(true);

      try {
        console.log(
          `Retrying initialization with student: ${selectedContact.fullName} (ID: ${selectedContact.id})`,
        );

        // First, explicitly create the student user in Stream Chat via our backend
        console.log('Explicitly creating student user in Stream Chat...');
        const createUserResponse = await fetch('/api/chat/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: selectedContact.id.toString(),
          }),
        });

        if (!createUserResponse.ok) {
          const errorText = await createUserResponse.text();
          console.error('Failed to create user in Stream Chat:', errorText);
          throw new Error(`Failed to create user in Stream Chat: ${errorText}`);
        }

        const userData = await createUserResponse.json();
        console.log('User created successfully:', userData);

        // Channel ID is created by sorting and joining both user IDs
        const members = [
          userId.toString(),
          selectedContact.id.toString(),
        ].sort();
        const channelId = members.join('-');
        console.log(`Generated channel ID: ${channelId}`);

        // First, call our backend API to establish the relationship
        console.log('Creating channel via backend...');
        const response = await fetch('/api/chat/channel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetUserId: selectedContact.id,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Backend channel creation failed:', errorText);
          throw new Error(
            `Failed to initialize chat channel: ${errorText || 'Unknown error'}`,
          );
        }

        console.log('Backend relationship established successfully');

        // Create the channel in Stream
        console.log('Creating channel in Stream Chat...');
        const channel = client.channel('messaging', channelId, {
          members,
          name: `${selectedContact.fullName}`,
          subtitle: selectedContact.srCode,
        });

        console.log('Watching channel...');
        await channel.watch();
        console.log('Channel created and watching');
        setActiveChannel(channel);
        setError(null);
        setShowContactsList(false);
      } catch (error: any) {
        console.error('Error creating channel:', error);
        setError(
          `Failed to create chat channel: ${error.message || 'Unknown error'}`,
        );
      } finally {
        setIsInitializingChannel(false);
      }
    }
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) =>
      contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [contacts, searchQuery]);

  const handleBackToContacts = () => {
    setShowContactsList(true);
  };

  // Reset active channel when going back to contacts list
  useEffect(() => {
    if (showContactsList) {
      setActiveChannel(null);
    }
  }, [showContactsList]);

  return (
    <SidebarInset className='py-4 px-8 flex flex-row gap-4'>
      <div className='w-3/4 flex flex-col gap-4'>
        <div className='grid grid-cols-3 gap-2 font-semibold'>
          <Card className='bg-yellow-400'>
            <CardHeader>
              <CardTitle>Pre-OJT</CardTitle>
            </CardHeader>
            <CardContent className='flex justify-end'>
              {isPending ? (
                <Skeleton className='h-5 w-10' />
              ) : (
                <p>{dashboard?.ojts.preOJTCount}</p>
              )}
            </CardContent>
          </Card>
          <Card className='bg-red-400'>
            <CardHeader>
              <CardTitle>OJT</CardTitle>
            </CardHeader>
            <CardContent className='flex justify-end'>
              {isPending ? (
                <Skeleton className='h-5 w-10' />
              ) : (
                <p>{dashboard?.ojts.ojtCount}</p>
              )}
            </CardContent>
          </Card>
          <Card className='bg-blue-400'>
            <CardHeader>
              <CardTitle>Post-OJT</CardTitle>
            </CardHeader>
            <CardContent className='flex justify-end'>
              {isPending ? (
                <Skeleton className='h-5 w-10' />
              ) : (
                <p>{dashboard?.ojts.postOJTCount}</p>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className='h-full'>
          <CardHeader>
            <CardTitle>Student Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className='grid gap-2 w-full'>
                {new Array(5).fill('').map((_, index) => (
                  <Skeleton className='w-full h-10' key={index} />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPending ? (
                    <TableRowSkeleton columnCount={3} />
                  ) : (
                    dashboard?.logs.map((item) => (
                      <TableRow key={item.logs.id}>
                        <TableCell>{item.users.fullName}</TableCell>
                        <TableCell>{item.classes?.name}</TableCell>
                        <TableCell>{item.logs.text}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <div className='w-1/4 flex flex-col gap-4'>
        <div className='h-full grid gap-4'>
          {isCoordinator && (
            <Card className='overflow-y-auto'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle>Links</CardTitle>
                  <AddLinkDialog />
                </div>
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
          )}
          <Card className='overflow-y-auto'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>Notifications</CardTitle>
                <AddNotificationDialog role={role} />
              </div>
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
        {/* <Card className={cn('h-3/5 flex flex-col', isAdmin && 'h-full')}>
          <CardHeader>
            <CardTitle>Chat with Students</CardTitle>
          </CardHeader>
          <CardContent className='p-0 flex flex-col h-0 flex-1'>
            {isLoadingChat ? (
              <div className='flex items-center justify-center h-full'>
                <Loader2 className='w-6 h-6 animate-spin' />
              </div>
            ) : !isCoordinator ? (
              <div className='flex items-center justify-center h-full text-center p-4'>
                <p className='text-muted-foreground'>
                  Only coordinators can access the chat feature
                </p>
              </div>
            ) : !client ? (
              <div className='flex items-center justify-center h-full text-center p-4'>
                <p className='text-muted-foreground'>
                  Could not initialize chat. Please try again later.
                </p>
              </div>
            ) : (
              <div className='flex h-full'>
                {showContactsList && (
                  <div className='w-full mx-6'>
                    <Input
                      placeholder='Search'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <ScrollArea className='h-full'>
                      <div className='p-2'>
                        {contacts.length === 0 ? (
                          <div className='flex items-center justify-center h-20 text-center p-4'>
                            <p className='text-xs text-muted-foreground'>
                              No students assigned
                            </p>
                          </div>
                        ) : (
                          filteredContacts.map((contact) => (
                            <div
                              key={contact.id}
                              onClick={() => handleContactSelection(contact)}
                              className='flex items-center justify-between gap-2 p-2 cursor-pointer hover:bg-muted rounded-md mb-1'>
                              <div className='flex items-center gap-2'>
                                <Avatar className='h-8 w-8'>
                                  <AvatarImage
                                    src={contact.profilePictureUrl ?? undefined}
                                  />
                                  <AvatarFallback>
                                    {getInitials(contact.fullName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className='overflow-hidden'>
                                  <p className='text-sm font-medium truncate'>
                                    {contact.fullName}
                                  </p>
                                  <p className='text-xs text-muted-foreground truncate'>
                                    {contact.srCode}
                                  </p>
                                </div>
                              </div>
                              {contact.unreadCount > 0 && (
                                <span className='relative flex size-3'>
                                  <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75'></span>
                                  <span className='relative inline-flex size-3 rounded-full bg-sky-500'></span>
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {!showContactsList && (
                  <div className='w-full flex flex-col h-full'>
                    {error ? (
                      <div className='flex items-center justify-center h-full text-center p-4 flex-col gap-2'>
                        <p className='text-muted-foreground'>{error}</p>
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            onClick={handleBackToContacts}
                            variant='outline'>
                            <ChevronLeft className='h-4 w-4 mr-1' />
                            Back
                          </Button>
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
                      <div className='flex items-center justify-center h-full'>
                        <Loader2 className='w-6 h-6 animate-spin' />
                      </div>
                    ) : (
                      <Chat client={client} theme='messaging light'>
                        <Channel channel={activeChannel}>
                          <Window>
                            <CustomChannelHeader
                              onBackClick={handleBackToContacts}
                              name={`Chat with ${selectedContact?.fullName}`}
                            />
                            <MessageList />
                            <MessageInput />
                          </Window>
                        </Channel>
                      </Chat>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card> */}
      </div>
    </SidebarInset>
  );
}
