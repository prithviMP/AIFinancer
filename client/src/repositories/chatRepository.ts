import { api } from '@/lib/apiClient';

// Types
export interface ChatSession {
  id: string;
  user_id: string;
  created_at: string;
  is_active: boolean;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
  is_from_user: boolean;
  timestamp: string;
  document_context?: any;
}

export interface SendMessageRequest {
  content: string;
  session_id: string;
  is_from_user: boolean;
  document_context?: any;
}

export interface ChatRepository {
  sendMessage(message: SendMessageRequest): Promise<ChatMessage>;
  getChatHistory(sessionId?: string): Promise<ChatMessage[]>;
  createChatSession(): Promise<ChatSession>;
  getChatSessions(): Promise<ChatSession[]>;
  deleteChatSession(sessionId: string): Promise<void>;
}

// Implementation
export class ChatRepositoryImpl implements ChatRepository {
  async sendMessage(message: SendMessageRequest): Promise<ChatMessage> {
    try {
      const response = await api.sendMessage(message);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  async getChatHistory(sessionId?: string): Promise<ChatMessage[]> {
    try {
      const response = await api.getChatHistory(sessionId);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw new Error('Failed to fetch chat history');
    }
  }

  async createChatSession(): Promise<ChatSession> {
    try {
      const response = await api.createChatSession();
      return response.data;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw new Error('Failed to create chat session');
    }
  }

  async getChatSessions(): Promise<ChatSession[]> {
    try {
      const response = await api.getChatSessions();
      return response.data;
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      throw new Error('Failed to fetch chat sessions');
    }
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      await api.deleteChatSession(sessionId);
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw new Error('Failed to delete chat session');
    }
  }
}

// Export singleton instance
export const chatRepository = new ChatRepositoryImpl();