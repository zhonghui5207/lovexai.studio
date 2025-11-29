# LoveXAI Studio: Supabase to Convex Migration Plan

## 🎯 Objective
Migrate the backend infrastructure from Supabase (Postgres) to Convex to leverage its real-time capabilities, superior developer experience, and better suitability for AI chat applications.

## 📅 Status Tracker

### Phase 1: Environment & Foundation
- [ ] **1.1 Initialize Convex**
    - [ ] Run `npx convex dev` to initialize the project.
    - [ ] Create `convex/` directory structure.
    - [ ] Configure `.env.local` with Convex deployment URL.
- [ ] **1.2 Define Database Schema (`convex/schema.ts`)**
    - [ ] Analyze `models/*.ts` to extract table structures.
    - [ ] Define `users` table.
    - [ ] Define `characters` table (add search indexes).
    - [ ] Define `conversations` table.
    - [ ] Define `messages` table.
    - [ ] Define `generation_settings` table.
    - [ ] Define `feedback`, `orders`, etc.

### Phase 2: Core Logic Migration (Backend)
*Migrate logic from `models/` to `convex/` functions.*

- [x] **2.1 User System (`convex/users.ts`)**
    - [x] `storeUser`: Create/Update user (replace `findOrCreateUser`).
    - [x] `getUser`: Get current user profile.
    - [x] `updateCredits`: Credit management logic.
    - [x] **Auth Integration**: Set up Convex to work with the existing Auth provider (likely NextAuth/Clerk).
- [x] **2.2 Character System (`convex/characters.ts`)**
    - [x] `list`: Get all active characters (replace `getAllCharacters`).
    - [x] `get`: Get character by ID.
    - [x] `search`: Implement full-text search (replace `searchCharacters`).
    - [x] `create/update`: Admin functions for character management.
- [x] **2.3 Chat System (`convex/conversations.ts` & `convex/messages.ts`)**
    - [x] `createConversation`: Start a new chat.
    - [x] `listConversations`: Get user's history.
    - [x] `sendMessage`: Save user message.
    - [x] `listMessages`: Real-time message history (replace `getConversationMessages`).
- [x] **2.4 AI Integration (`convex/actions.ts`)**
    - [x] Create internal Action to call LLM APIs (OpenAI/DeepSeek).
    - [x] Implement streaming response handling in Convex.

### Phase 3: Frontend Integration
*Replace Supabase SDK calls with Convex React Hooks.*

- [x] **3.1 Setup**
    - [x] Wrap app with `ConvexClientProvider`.
    - [x] Configure Auth loading state.
- [x] **3.2 Discover Page**
    - [x] Replace `fetch('/api/characters')` with `useQuery(api.characters.list)`.
- [x] **3.3 Chat Interface**
    - [x] Replace `fetch('/api/conversations')` with `useQuery(api.conversations.list)`.
    - [x] Replace `fetch('/api/messages')` with `useQuery(api.messages.list)`.
    - [x] Replace `sendMessage` API call with `useMutation(api.messages.send)`.
    - [x] Trigger AI response via `useAction(api.actions.generateResponse)`.
- [x] **3.4 Sidebar**
    - [x] Use `useQuery` for conversation history (Integrated in ChatPage).

### Phase 4: Data Migration
- [x] **4.1 Migration Script**
    - [x] Created `scripts/migrate-supabase-to-convex.ts`.
    - [x] Added `legacy_id` to schema for mapping.
    - [x] Executed migration for Users, Characters, Conversations, and Messages.

## Phase 5: Cleanup (Completed)

- [x] Remove Supabase client initialization code.
- [x] Remove unused API routes (`app/api/...`).
- [x] Remove `models/` directory.
- [x] Remove Supabase dependencies (`@supabase/supabase-js`).
- [x] Verify all features are working with Convex.nt variables.

---

## 📝 Issues & Solutions Log

| Date | Issue | Solution |
| :--- | :--- | :--- |
| | | |

---

## 💡 Notes
- **Authentication**: We need to check how `next-auth` is currently set up and ensure the session token can be passed to Convex for RLS (Row Level Security).
- **Real-time**: Convex queries are reactive by default. Remove any `useEffect` or manual polling logic in the frontend.
