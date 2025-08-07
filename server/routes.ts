import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { storage } from "./storage";
import { AIService } from "./services/aiService";
import { DocumentProcessor } from "./services/documentProcessor";
import { ChatService, type ChatClient } from "./services/chatService";
import { insertDocumentSchema } from "@shared/schema";

// Extend Request interface for user authentication
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username?: string; name?: string; role?: string };
    }
  }
}

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
    }
  }
});

const aiService = new AIService();
const documentProcessor = new DocumentProcessor();
const chatService = new ChatService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Default user middleware (simulate authentication)
  app.use((req, res, next) => {
    req.user = { id: 'default-user' };
    next();
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getDocumentStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Processing queue endpoint
  app.get("/api/documents/queue", async (req, res) => {
    try {
      const userId = req.user.id;
      const queue = await storage.getProcessingQueue(userId);
      res.json(queue);
    } catch (error) {
      console.error("Error fetching processing queue:", error);
      res.status(500).json({ error: "Failed to fetch processing queue" });
    }
  });

  // Document upload endpoint
  app.post("/api/documents/upload", upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = req.user.id;
      
      // Create document record
      const documentData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: userId,
      };

      const document = await storage.createDocument(documentData);

      // Process document asynchronously
      processDocumentAsync(document.id, req.file.path);

      res.json({
        id: document.id,
        filename: document.originalName,
        status: 'uploaded',
        message: 'Document uploaded successfully and is being processed'
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Get documents endpoint
  app.get("/api/documents", async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const documents = await storage.getDocuments(userId, limit);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get specific document
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // Query documents endpoint
  app.post("/api/documents/query", async (req, res) => {
    try {
      const { query } = req.body;
      const userId = req.user.id;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Get user documents for context
      const documents = await storage.getDocuments(userId);
      const documentContext = documents.map(doc => ({
        id: doc.id,
        type: doc.documentType,
        filename: doc.originalName,
        extractedData: doc.extractedData,
        ocrText: doc.ocrText,
      }));

      // Generate AI response
      const response = await aiService.generateChatResponse(query, documentContext);
      
      res.json({ 
        query,
        response,
        contextDocuments: documentContext.length
      });
    } catch (error) {
      console.error("Error processing query:", error);
      res.status(500).json({ error: "Failed to process query" });
    }
  });

  // Chat history endpoint
  app.get("/api/chat/history", async (req, res) => {
    try {
      const userId = req.user.id;
      const messages = await chatService.getChatHistory(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server for chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    const clientId = randomUUID();
    const userId = 'default-user'; // In production, extract from auth token
    
    const client: ChatClient = {
      id: clientId,
      userId,
      websocket: ws,
    };

    chatService.addClient(client);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'message',
      content: 'Hello! I can help you analyze your financial documents. Try asking me about invoices, expenses, or document insights.',
      timestamp: new Date().toISOString(),
      isFromBot: true,
    }));

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'chat' && message.content) {
          await chatService.handleMessage(clientId, message.content);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          content: 'Invalid message format',
          timestamp: new Date().toISOString(),
          isFromBot: true,
        }));
      }
    });

    ws.on('close', () => {
      chatService.removeClient(clientId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      chatService.removeClient(clientId);
    });
  });

  return httpServer;
}

// Async document processing function
async function processDocumentAsync(documentId: string, filePath: string): Promise<void> {
  try {
    // Update status to processing
    await storage.updateDocument(documentId, { 
      status: 'processing' 
    });

    const document = await storage.getDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Process the document
    const result = await documentProcessor.processDocument(filePath, document.mimeType);
    
    if (result.success) {
      // Analyze with AI
      const analysis = await aiService.analyzeDocument(
        result.ocrText || '', 
        document.originalName
      );

      // Update document with results
      await storage.updateDocument(documentId, {
        status: 'completed',
        processedAt: new Date(),
        ocrText: result.ocrText,
        documentType: analysis.documentType,
        extractedData: analysis,
        totalValue: analysis.totalAmount ? Math.round(analysis.totalAmount * 100) : null,
      });
    } else {
      await storage.updateDocument(documentId, {
        status: 'failed',
        processedAt: new Date(),
      });
    }

    // Cleanup temp file
    await documentProcessor.cleanupTempFile(filePath);

  } catch (error) {
    console.error('Document processing error:', error);
    await storage.updateDocument(documentId, {
      status: 'failed',
      processedAt: new Date(),
    });
  }
}

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
