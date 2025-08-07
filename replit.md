# replit.md

## Overview

FinanceAI is an AI-powered financial document automation system designed for B2B clients. The application provides automated extraction, understanding, and querying of financial documents (invoices, contracts, balance sheets, etc.) using AI technologies. The system features a React frontend with Shadcn UI components and an Express.js backend with AI capabilities for document processing and real-time chat interactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: Zustand for dashboard state, React Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Custom theme provider supporting light/dark modes with CSS variables

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **AI Integration**: Custom AI service using OpenAI GPT models for document analysis
- **Document Processing**: Modular document processor supporting PDF and image files
- **Real-time Communication**: WebSocket implementation for chat functionality
- **File Upload**: Multer middleware for handling document uploads with file type validation
- **Storage Layer**: In-memory storage implementation with interface for easy database migration

### Data Models
- **Users**: Basic user management with authentication simulation
- **Documents**: File metadata, processing status, extracted data, and OCR text
- **Chat System**: Sessions and messages for AI-powered document queries
- **Analytics**: Document statistics and processing metrics

### AI Services
- **Document Analysis**: Automated extraction of financial entities (amounts, dates, vendors, etc.)
- **Chat Integration**: Contextual AI responses based on uploaded documents
- **OCR Processing**: Text extraction from PDF and image files

### Development Tools
- **Database ORM**: Drizzle configured for PostgreSQL with schema definitions
- **Build System**: ESBuild for server bundling, Vite for client bundling
- **Type Safety**: Shared TypeScript schemas between client and server

## External Dependencies

### Core Dependencies
- **Database**: Neon serverless PostgreSQL with Drizzle ORM
- **AI Service**: OpenAI API for GPT models
- **File Processing**: Planned integration with Tesseract OCR and PDF parsing libraries
- **UI Components**: Radix UI primitives for accessible component foundation

### Development Dependencies
- **Build Tools**: Vite with React plugin, ESBuild for server bundling
- **File Upload**: Uppy components for enhanced file upload experience
- **State Management**: TanStack React Query for server state caching

### Optional Integrations
- **Cloud Storage**: Google Cloud Storage configuration available
- **File Processing**: AWS S3 integration via Uppy plugins

The architecture emphasizes modularity and type safety, with a clear separation between AI processing services, document management, and user interface components. The system is designed to scale from in-memory storage to full database implementations while maintaining consistent interfaces.