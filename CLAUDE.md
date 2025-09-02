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

## Development Workflow Guidelines

### Before starting ANY feature development, MUST:

1. **Comprehensive Code Investigation**
   - Use Glob/Grep tools to search for related functionality
   - Examine existing models, services, and API routes
   - Understand current data structures and business logic
   - Check for similar or overlapping features

2. **Architecture Analysis**
   - Identify existing patterns and conventions
   - Understand the current implementation approach
   - Map out data flow and dependencies
   - Review authentication and authorization methods

3. **Solution Planning**
   - Present multiple approaches (extend existing vs create new)
   - Explain pros/cons of each approach
   - Identify potential conflicts or duplications
   - Recommend the best solution with reasoning

4. **User Confirmation**
   - Get explicit approval before writing any code
   - Confirm the chosen approach and scope
   - Clarify requirements and constraints
   - Establish success criteria

5. **Incremental Implementation**
   - Break work into logical steps
   - Seek confirmation at major milestones
   - Test each component before proceeding
   - Document changes and reasoning

### Architecture Principles

- **Extend, Don't Duplicate**: Always prefer extending existing systems over creating parallel ones
- **Follow Existing Patterns**: Maintain consistency with current code style and architecture
- **Respect Layer Separation**: Follow the models → services → API routes hierarchy
- **Reuse Business Logic**: Leverage existing authentication, validation, and business rules
- **Maintain Type Safety**: Use existing TypeScript definitions and patterns

### Forbidden Practices

- ❌ Starting development without thorough investigation
- ❌ Bypassing existing business logic layers
- ❌ Creating duplicate functionality without justification
- ❌ Ignoring established authentication patterns
- ❌ Making architectural changes without user approval

### Code Quality Standards

- Follow existing naming conventions
- Use established error handling patterns
- Maintain consistent API response formats
- Add proper TypeScript types and interfaces
- Include comprehensive error handling and validation

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