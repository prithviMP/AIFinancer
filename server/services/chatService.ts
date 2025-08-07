import { WebSocket } from 'ws';
import { storage } from '../storage';
import { AIService } from './aiService';
import type { ChatMessage, InsertChatMessage } from '@shared/schema';

export interface ChatClient {
  id: string;
  userId: string;
  websocket: WebSocket;
  sessionId?: string;
}

export class ChatService {
  private clients: Map<string, ChatClient> = new Map();
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  addClient(client: ChatClient): void {
    this.clients.set(client.id, client);
    console.log(`Chat client connected: ${client.id}`);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`Chat client disconnected: ${clientId}`);
  }

  async handleMessage(clientId: string, message: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) {
      console.error(`Client not found: ${clientId}`);
      return;
    }

    try {
      // Get or create chat session
      let session = await storage.getActiveChatSession(client.userId);
      if (!session) {
        session = await storage.createChatSession({ userId: client.userId });
      }
      client.sessionId = session.id;

      // Store user message
      await storage.createChatMessage({
        sessionId: session.id,
        content: message,
        isFromUser: true,
        documentContext: null,
      });

      // Get chat history for context
      const chatHistory = await storage.getChatMessages(session.id);
      const recentHistory = chatHistory
        .slice(-10) // Last 10 messages for context
        .map(msg => ({
          role: msg.isFromUser ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));

      // Get user's documents for context
      const userDocuments = await storage.getDocuments(client.userId, 50);
      const documentContext = userDocuments.map(doc => ({
        id: doc.id,
        type: doc.documentType,
        filename: doc.originalName,
        extractedData: doc.extractedData,
        totalValue: doc.totalValue,
        status: doc.status,
      }));

      // Generate AI response
      const aiResponse = await this.aiService.generateChatResponse(
        message,
        documentContext,
        recentHistory
      );

      // Store AI response
      await storage.createChatMessage({
        sessionId: session.id,
        content: aiResponse,
        isFromUser: false,
        documentContext: { relevantDocuments: documentContext.slice(0, 5) },
      });

      // Send response to client
      this.sendMessage(clientId, {
        type: 'message',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        isFromBot: true,
      });

    } catch (error) {
      console.error('Error handling chat message:', error);
      this.sendMessage(clientId, {
        type: 'error',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date().toISOString(),
        isFromBot: true,
      });
    }
  }

  private sendMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (client && client.websocket.readyState === WebSocket.OPEN) {
      client.websocket.send(JSON.stringify(message));
    }
  }

  broadcast(message: any): void {
    this.clients.forEach((client) => {
      this.sendMessage(client.id, message);
    });
  }

  async getChatHistory(userId: string): Promise<ChatMessage[]> {
    const session = await storage.getActiveChatSession(userId);
    if (!session) return [];
    
    return await storage.getChatMessages(session.id);
  }
}
