import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("Finance Manager"),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").notNull().default(sql`now()`),
  processedAt: timestamp("processed_at"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  documentType: text("document_type"), // invoice, contract, receipt, other
  extractedData: jsonb("extracted_data"),
  ocrText: text("ocr_text"),
  totalValue: integer("total_value"), // in cents
});

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  isActive: boolean("is_active").notNull().default(true),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => chatSessions.id),
  content: text("content").notNull(),
  isFromUser: boolean("is_from_user").notNull(),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
  documentContext: jsonb("document_context"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  filename: true,
  originalName: true,
  mimeType: true,
  size: true,
  uploadedBy: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  userId: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  content: true,
  isFromUser: true,
}).extend({
  documentContext: z.any().optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export interface DocumentStats {
  totalDocuments: number;
  processedToday: number;
  totalValue: string;
  accuracy: string;
  documentsByType: {
    invoices: number;
    contracts: number;
    receipts: number;
    others: number;
  };
  dailyProcessing: Array<{
    date: string;
    count: number;
  }>;
}

export interface ProcessingQueue {
  id: string;
  filename: string;
  status: string;
  progress: number;
  type: 'pdf' | 'image' | 'other';
}
