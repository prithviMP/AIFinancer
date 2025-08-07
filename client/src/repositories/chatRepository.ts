import { apiClient } from './apiClient';
import { RequestOptions } from './types';
import { ChatSession, ChatMessage } from '@shared/schema';

export interface SendMessageData {
  content: string;
  documentContext?: any;
}

export interface CreateSessionData {
  userId: string;
}

export class ChatRepository {
  private readonly basePath = '/api/chat';

  async getSessions(options?: RequestOptions): Promise<ChatSession[]> {
    return apiClient.get<ChatSession[]>(`${this.basePath}/sessions`, options);
  }

  async getActiveSession(options?: RequestOptions): Promise<ChatSession | null> {
    try {
      return await apiClient.get<ChatSession>(`${this.basePath}/sessions/active`, options);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createSession(data: CreateSessionData, options?: RequestOptions): Promise<ChatSession> {
    return apiClient.post<ChatSession>(`${this.basePath}/sessions`, data, options);
  }

  async getSession(id: string, options?: RequestOptions): Promise<ChatSession> {
    return apiClient.get<ChatSession>(`${this.basePath}/sessions/${id}`, options);
  }

  async getMessages(sessionId: string, options?: RequestOptions): Promise<ChatMessage[]> {
    return apiClient.get<ChatMessage[]>(`${this.basePath}/sessions/${sessionId}/messages`, options);
  }

  async sendMessage(sessionId: string, data: SendMessageData, options?: RequestOptions): Promise<ChatMessage> {
    return apiClient.post<ChatMessage>(`${this.basePath}/sessions/${sessionId}/messages`, data, options);
  }

  async deleteSession(id: string, options?: RequestOptions): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/sessions/${id}`, options);
  }

  async clearHistory(sessionId: string, options?: RequestOptions): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/sessions/${sessionId}/messages`, options);
  }
}

export const chatRepository = new ChatRepository();