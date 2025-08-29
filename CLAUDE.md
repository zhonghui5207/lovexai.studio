# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Dev server**: `pnpm dev` (uses Turbopack for faster builds)
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`
- **Analyze bundle**: `pnpm analyze`
- **Cloudflare build**: `pnpm cf:build`
- **Cloudflare preview**: `pnpm cf:preview`
- **Cloudflare deploy**: `pnpm cf:deploy`

## Architecture Overview

This is a Next.js 15 TypeScript application using App Router with internationalization support. Key architectural decisions:

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + Shadcn UI components
- **Authentication**: NextAuth.js v5 beta
- **Database**: Supabase
- **Payments**: Stripe
- **Internationalization**: next-intl
- **State Management**: React Context
- **AI Integration**: Vercel AI SDK with multiple provider support (OpenAI, DeepSeek, Replicate, OpenRouter)

### Project Structure
- `app/[locale]/`: Localized pages using next-intl
- `components/blocks/`: Landing page layout components (header, footer, etc.)
- `components/ui/`: Reusable Shadcn UI components
- `i18n/pages/landing/`: Page-specific translations for landing page
- `i18n/messages/`: Global message translations
- `models/`: Data models and database operations
- `services/`: Business logic layer
- `contexts/`: React contexts for state management
- `types/`: TypeScript type definitions organized by feature

### Configuration Files
- `next.config.mjs`: Includes MDX, bundle analyzer, and internationalization plugins
- `tailwind.config.ts`: Extended with custom animations and Shadcn UI integration
- `.env.example`: Template for required environment variables

### Development Notes
- Uses React 19 and strict TypeScript
- Supports multiple AI providers through a unified SDK
- Implements comprehensive theming with CSS variables
- Built for deployment to both Vercel and Cloudflare Pages
- MDX support enabled for content pages

### Environment Setup
Copy `.env.example` to `.env.local` and configure:
- Supabase credentials for database
- NextAuth providers (Google, GitHub)
- Stripe keys for payments
- Analytics (Google Analytics, OpenPanel)
- AWS S3 for file storage