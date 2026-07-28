import type { Contact, User } from "./schema";

export interface LastMessage {
  id: string;
  content: string | null;
  sender: string;
  senderId: string;
  timestamp: string;
  messageId: string;
  status: string;
  type: string;
  attachments: string | null;
  createdAt: Date;
  timeAgo: string;
  reactions?: any[];
}

export interface Chat extends Contact {
  lastMessage: LastMessage | null;
  unreadCount: number;
  contact: Contact;
  assignedUser: User | null;
}

export interface ChatMessage {
  id: string;
  content: string | null;
  sender: string;
  senderId: string;
  timestamp: string;
  messageId: string;
  status: string;
  type: string;
  attachments: string | null;
  createdAt: Date;
  timeAgo: string;
  reactions?: any[];
}

export interface MenuItem {
  key: string;
  icon: string;
  label: string;
  to: string;
  nameRoute: string;
}
