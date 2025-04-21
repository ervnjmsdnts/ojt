import { createContext, useContext, useEffect, useState } from 'react';
import {
  StreamChat,
  Channel as StreamChannel,
  LiteralStringForUnion,
} from 'stream-chat';
import { ChannelResponse } from '../types/chat';

type ChatContextType = {
  client: StreamChat | null;
  connectUser: (userId: number) => Promise<void>;
  disconnectUser: () => Promise<void>;
  createChannel: (targetUserId: number) => Promise<ChannelResponse | null>;
  isConnected: boolean;
  totalUnreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  markChannelRead: (channelId: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize Stream Chat client
  useEffect(() => {
    // Get API key from environment variable
    const apiKey = import.meta.env.VITE_STREAM_API_KEY;

    if (!apiKey) {
      console.error('Stream Chat API key is missing');
      return;
    }

    const chatClient = StreamChat.getInstance(apiKey);
    setClient(chatClient);

    // Cleanup on unmount
    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
      }
    };
  }, []);

  // Listen for new messages to update unread count
  useEffect(() => {
    if (!client || !isConnected || !userId) return;

    const handleMessageNew = (event: any) => {
      // Only count messages from others, not from current user
      if (event.message.user.id !== userId) {
        refreshUnreadCount();
      }
    };

    const handleMessageRead = () => {
      // When any message is marked as read, refresh the unread count
      refreshUnreadCount();
    };

    // Listen for both new messages and read messages
    client.on('message.new', handleMessageNew);
    client.on('message.read', handleMessageRead);

    // Initial count
    refreshUnreadCount();

    return () => {
      client.off('message.new', handleMessageNew);
      client.off('message.read', handleMessageRead);
    };
  }, [client, isConnected, userId]);

  const refreshUnreadCount = async () => {
    if (!client || !isConnected) return;

    try {
      // Get all channels for the current user
      const filter = { members: { $in: [userId as string] } };
      const channels = await client.queryChannels(
        filter,
        {},
        {
          state: true,
        },
      );

      // Sum up unread counts across all channels
      let count = 0;
      channels.forEach((channel) => {
        count += channel.countUnread();
      });

      setTotalUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const connectUser = async (userId: number) => {
    if (!client) return;

    try {
      // Get token from our backend
      const response = await fetch('/api/chat/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.toString() }),
      });

      if (!response.ok) {
        throw new Error('Failed to get token');
      }

      const { token, user } = await response.json();

      // Store user ID for unread message tracking
      setUserId(userId.toString());

      // Connect to Stream Chat
      await client.connectUser(
        {
          id: userId.toString(),
          name: user.name,
          role: user.role,
          image: user.image,
        },
        token,
      );

      setIsConnected(true);

      // Initial count after connection
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error connecting to Stream Chat:', error);
      setIsConnected(false);
    }
  };

  const disconnectUser = async () => {
    if (!client) return;

    try {
      await client.disconnectUser();
      setIsConnected(false);
      setUserId(null);
      setTotalUnreadCount(0);
    } catch (error) {
      console.error('Error disconnecting from Stream Chat:', error);
    }
  };

  const createChannel = async (
    targetUserId: number,
  ): Promise<ChannelResponse | null> => {
    if (!client || !isConnected) return null;

    try {
      // Create channel through our backend
      const response = await fetch('/api/chat/channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create channel');
      }

      const channelData = await response.json();
      return channelData;
    } catch (error) {
      console.error('Error creating channel:', error);
      return null;
    }
  };

  // Update the channel handling in dashboard components to mark messages as read
  const markChannelRead = async (channelId: string) => {
    if (!client || !isConnected) return;

    try {
      const channel = client.channel('messaging', channelId);
      await channel.markRead();
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error marking channel as read:', error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        client,
        connectUser,
        disconnectUser,
        createChannel,
        isConnected,
        totalUnreadCount,
        refreshUnreadCount,
        markChannelRead,
      }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
