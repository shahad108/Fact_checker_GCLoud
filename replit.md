# Wahrify - AI-Powered Fact-Checking Application

## Overview

Wahrify is a modern fact-checking application built with React and Node.js that uses AI to analyze claims and verify their accuracy. The application provides users with reliability scores, detailed analysis, and source verification for any claim they submit.

The application now features a conversational chat interface similar to modern AI assistants, where users can submit claims and receive detailed analysis in a natural conversation flow.

## User Preferences

Preferred communication style: Simple, everyday language.
Design preference: Clean, modern chat interface with professional styling.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Query (@tanstack/react-query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **UI Pattern**: Conversational chat interface with message bubbles and real-time analysis

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM (using in-memory storage for development)
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **AI Integration**: OpenRouter API for claim analysis using DeepSeek R1
- **Session Management**: Express sessions with PostgreSQL storage

## Key Components

### Database Schema
- **Users**: Stores user profiles with username, password, name, plan, and avatar
- **Claims**: Stores fact-checking requests with analysis results, reliability scores, and status tracking
- **Sources**: Stores reference sources for claims with credibility scores and metadata

### AI Analysis System
- Uses OpenRouter API to access DeepSeek R1 model for claim verification
- Provides reliability scores (0-100) based on evidence
- Generates detailed analysis with source quality assessment
- Includes bias detection and recency scoring
- Returns structured JSON responses with source citations
- Real-time analysis with chat-like interface

### Storage Layer
- **IStorage Interface**: Abstracts data persistence operations
- **MemStorage**: In-memory storage implementation for development
- **Database Operations**: User management, claim processing, source tracking, and analytics

## Data Flow

1. **Claim Submission**: User enters claim text in chat interface
2. **Message History**: Chat messages are stored in component state for conversation flow
3. **Initial Processing**: Claim is stored with "pending" status
4. **AI Analysis**: OpenRouter API analyzes the claim and returns structured results
5. **Data Persistence**: Analysis results are stored with reliability scores and sources
6. **Real-time Updates**: Frontend polls for analysis completion every 2 seconds
7. **Results Display**: User sees comprehensive analysis card with visual reliability indicators in chat

## Recent Changes (January 2025)

- **Chat Interface**: Redesigned the main interface to use a conversational chat pattern similar to modern AI assistants
- **OpenRouter Integration**: Updated AI service to use OpenRouter API with DeepSeek R1 model for better analysis
- **Visual Improvements**: Enhanced color scheme with blue-purple gradients and improved typography
- **Message System**: Implemented chat message history with user/assistant/analysis message types
- **Real-time Updates**: Added polling system for live analysis updates in chat interface
- **TypeScript Fixes**: Resolved all type compatibility issues in storage and routes

## External Dependencies

### Core Dependencies
- **OpenAI**: AI-powered claim analysis
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling

### Development Tools
- **Vite**: Development server and build tool
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundling
- **Replit Integration**: Development environment support

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite compiles React application to static assets
2. **Backend Build**: ESBuild bundles TypeScript server code
3. **Database Migration**: Drizzle pushes schema changes to production database

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY` or `OPENROUTER_API_KEY`: AI API authentication
- `NODE_ENV`: Environment mode (development/production)

### Production Deployment
- **Static Assets**: Served from `dist/public` directory
- **API Server**: Express server handles API routes and serves static files
- **Database**: Managed PostgreSQL instance with connection pooling
- **Session Storage**: PostgreSQL-backed session management

The application follows a modern full-stack architecture with clear separation of concerns, type safety throughout, and scalable data storage solutions.