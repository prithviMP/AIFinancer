import { 
  type User, 
  type InsertUser, 
  type Document, 
  type InsertDocument,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type DocumentStats,
  type ProcessingQueue
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  getDocument(id: string): Promise<Document | undefined>;
  getDocuments(userId: string, limit?: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;
  getDocumentStats(userId: string): Promise<DocumentStats>;
  getProcessingQueue(userId: string): Promise<ProcessingQueue[]>;
  
  // Chat methods
  getChatSession(id: string): Promise<ChatSession | undefined>;
  getActiveChatSession(userId: string): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private documents: Map<string, Document>;
  private chatSessions: Map<string, ChatSession>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.chatSessions = new Map();
    this.chatMessages = new Map();

    // Create default user
    const defaultUser: User = {
      id: "default-user",
      username: "john.smith",
      password: "password123",
      name: "John Smith",
      role: "Finance Manager"
    };
    this.users.set(defaultUser.id, defaultUser);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocuments(userId: string, limit?: number): Promise<Document[]> {
    const userDocs = Array.from(this.documents.values())
      .filter(doc => doc.uploadedBy === userId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    
    return limit ? userDocs.slice(0, limit) : userDocs;
  }

  async createDocument(insertDoc: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDoc,
      id,
      uploadedAt: new Date(),
      processedAt: null,
      status: "pending",
      documentType: null,
      extractedData: null,
      ocrText: null,
      totalValue: null,
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updated = { ...document, ...updates };
    this.documents.set(id, updated);
    return updated;
  }

  async getDocumentStats(userId: string): Promise<DocumentStats> {
    const userDocs = await this.getDocuments(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const processedToday = userDocs.filter(doc => 
      doc.processedAt && new Date(doc.processedAt) >= today
    ).length;

    const totalValue = userDocs.reduce((sum, doc) => 
      sum + (doc.totalValue || 0), 0
    );

    const documentsByType = {
      invoices: userDocs.filter(d => d.documentType === 'invoice').length,
      contracts: userDocs.filter(d => d.documentType === 'contract').length,
      receipts: userDocs.filter(d => d.documentType === 'receipt').length,
      others: userDocs.filter(d => !d.documentType || d.documentType === 'other').length,
    };

    // Generate mock daily processing data for the last 7 days
    const dailyProcessing = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayDocs = userDocs.filter(doc => {
        if (!doc.processedAt) return false;
        const docDate = new Date(doc.processedAt);
        docDate.setHours(0, 0, 0, 0);
        return docDate.getTime() === date.getTime();
      });
      
      dailyProcessing.push({
        date: date.toISOString().split('T')[0],
        count: dayDocs.length,
      });
    }

    return {
      totalDocuments: userDocs.length,
      processedToday,
      totalValue: (totalValue / 100).toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      }),
      accuracy: "98.5%",
      documentsByType,
      dailyProcessing,
    };
  }

  async getProcessingQueue(userId: string): Promise<ProcessingQueue[]> {
    const userDocs = await this.getDocuments(userId);
    const processingDocs = userDocs
      .filter(doc => doc.status === 'processing')
      .map(doc => ({
        id: doc.id,
        filename: doc.originalName,
        status: doc.status,
        progress: Math.floor(Math.random() * 100), // Simulate progress
        type: doc.mimeType.includes('pdf') ? 'pdf' as const : 
              doc.mimeType.includes('image') ? 'image' as const : 'other' as const
      }));

    return processingDocs;
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }

  async getActiveChatSession(userId: string): Promise<ChatSession | undefined> {
    return Array.from(this.chatSessions.values()).find(
      session => session.userId === userId && session.isActive
    );
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const session: ChatSession = {
      ...insertSession,
      id,
      createdAt: new Date(),
      isActive: true,
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
