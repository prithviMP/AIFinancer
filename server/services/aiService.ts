import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface FinancialEntity {
  type: "invoice_number" | "amount" | "date" | "vendor" | "contract_term" | "payment_due" | "tax_amount";
  value: string;
  confidence: number;
  position?: { x: number; y: number; width: number; height: number };
}

export interface DocumentAnalysis {
  documentType: "invoice" | "contract" | "receipt" | "other";
  confidence: number;
  entities: FinancialEntity[];
  summary: string;
  totalAmount?: number;
  currency?: string;
}

export class AIService {
  async analyzeDocument(text: string, filename?: string): Promise<DocumentAnalysis> {
    try {
      const prompt = `
        Analyze the following financial document text and extract key information.
        Document filename: ${filename || 'unknown'}
        
        Text content:
        ${text}
        
        Please respond with JSON in this exact format:
        {
          "documentType": "invoice|contract|receipt|other",
          "confidence": 0.95,
          "entities": [
            {
              "type": "invoice_number|amount|date|vendor|contract_term|payment_due|tax_amount",
              "value": "extracted_value",
              "confidence": 0.9
            }
          ],
          "summary": "Brief summary of the document",
          "totalAmount": 1250.00,
          "currency": "USD"
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a financial document analysis expert. Extract key information and classify document types accurately."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      return analysis;
    } catch (error) {
      console.error("AI analysis failed:", error);
      return {
        documentType: "other",
        confidence: 0,
        entities: [],
        summary: "Analysis failed - unable to process document",
      };
    }
  }

  async generateChatResponse(
    message: string, 
    documentContext?: any[], 
    chatHistory?: Array<{role: 'user' | 'assistant', content: string}>
  ): Promise<string> {
    try {
      const systemPrompt = `
        You are FinanceAI Assistant, a helpful AI that specializes in financial document analysis and business intelligence.
        You can help users understand their financial documents, answer questions about invoices, contracts, receipts, and provide insights.
        
        Available document context: ${JSON.stringify(documentContext || [])}
        
        Guidelines:
        - Be professional and helpful
        - Provide specific answers when document data is available
        - Suggest actionable insights
        - If you don't have enough information, ask clarifying questions
        - Format numbers as currency when appropriate
        - Keep responses concise but informative
      `;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...(chatHistory || []),
        { role: "user" as const, content: message }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("Chat response generation failed:", error);
      return "I'm experiencing some technical difficulties. Please try again later.";
    }
  }

  async summarizeDocuments(documents: any[]): Promise<string> {
    if (documents.length === 0) {
      return "No documents to analyze.";
    }

    try {
      const prompt = `
        Provide a concise summary of these financial documents:
        ${JSON.stringify(documents.map(d => ({
          type: d.documentType,
          filename: d.originalName,
          amount: d.totalValue,
          status: d.status
        })))}
        
        Focus on:
        - Total count by type
        - Total monetary value
        - Key insights or patterns
        - Processing status overview
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a financial analyst providing document summaries."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 300,
      });

      return response.choices[0].message.content || "Unable to generate summary.";
    } catch (error) {
      console.error("Document summarization failed:", error);
      return "Unable to generate summary at this time.";
    }
  }
}
