export interface ChatContact {
  id: number;
  fullName: string;
  srCode: string;
  profilePictureUrl: string | undefined | null;
}

export interface ChatMessage {
  id: string | number;
  text: string;
  isSender: boolean;
  timestamp: number;
}

export interface ChannelResponse {
  channel: {
    id: string;
    type: string;
    name: string;
  };
}
