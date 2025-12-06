# Knoux Duplicate AI - Replit Setup

## Project Overview
This is a full-stack React application called "Knoux Duplicate AI" - an intelligent duplicate file detection and management system. The application uses the Fusion Starter template with:
- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + Radix UI
- **Backend**: Express.js API server
- **Build System**: Vite 7 with SWC
- **Package Manager**: PNPM

## Project Purpose
Knoux Duplicate AI helps users:
- Scan and detect duplicate files (images, videos, documents, audio)
- Manage duplicates with smart rules and suggestions
- Preview and compare duplicate files
- Safely trash/restore files with a safe trash system
- Apply automated rules for duplicate handling (keep largest, newest, best quality)

## Architecture

### Frontend (Client)
- **Location**: `/client`
- **Entry**: `client/main.tsx`
- **Routing**: React Router 6 (SPA mode)
- **State**: React Context API + TanStack Query
- **UI Components**: Radix UI primitives in `client/components/ui/`
- **Pages**: 
  - Index (Home/Dashboard)
  - Scan (File scanning)
  - Rules (Duplicate management rules)
  - Settings
  - Help
  - Onboarding/Splash screens

### Backend (Server)
- **Location**: `/server`
- **Entry**: `server/index.ts`
- **Port**: Integrated with Vite dev server on port 5000 (development)
- **API Routes**:
  - `/api/ping` - Health check
  - `/api/demo` - Demo endpoint
  - `/api/duplicates/*` - Duplicate detection and analysis
  - `/api/trash/*` - Safe trash management
  - `/api/rules/*` - Rule management
  - `/api/preview/*` - File preview generation

### Shared
- **Location**: `/shared`
- **Purpose**: Type definitions and interfaces shared between client and server

## Development Setup

### Configuration Changes for Replit
1. **Vite Configuration** (`vite.config.ts`):
   - Changed port from 8080 to 5000
   - Set host to `0.0.0.0` for Replit compatibility
   - Configured HMR (Hot Module Reload) for WebSocket proxy:
     - Host: Uses `REPLIT_DEV_DOMAIN` environment variable
     - Client port: 443
     - Protocol: WSS (secure WebSocket)

2. **Bug Fixes Applied**:
   - Fixed `sonner` toast import in `client/hooks/useNotification.ts` (import from 'sonner' package, not UI component)
   - Fixed invalid `Toggle2` icon in `client/pages/Rules.tsx` (changed to `ToggleLeft` from lucide-react)

### Workflow
- **Name**: Start application
- **Command**: `pnpm dev`
- **Port**: 5000
- **Type**: webview

## Deployment Configuration
- **Target**: Autoscale (stateless web application)
- **Build**: `pnpm build`
- **Run**: `node dist/server/production.mjs`
- **Build Output**: 
  - Client: `dist/spa/`
  - Server: `dist/server/`

## Key Features
1. **Duplicate Detection**: Intelligent file scanning with various algorithms
2. **Smart Rules**: Automated duplicate handling based on size, date, quality
3. **Safe Trash**: Temporary storage before permanent deletion
4. **File Preview**: Visual comparison of duplicate files
5. **Batch Operations**: Process multiple duplicates at once
6. **Multi-format Support**: Images, videos, documents, audio files

## Scripts
- `pnpm dev` - Start development server (frontend + backend)
- `pnpm build` - Production build (client + server)
- `pnpm start` - Start production server
- `pnpm typecheck` - TypeScript validation
- `pnpm test` - Run Vitest tests
- `pnpm format.fix` - Format code with Prettier

## Recent Changes (December 5, 2025)

### Backend API Integration (Latest)
- Created global state management in `client/context/AppContext.tsx` with:
  - Scan state (groups, totalDuplicates, recoverableSpace, isScanning, selectedForDelete)
  - Rules state synchronized with backend API
  - LocalStorage persistence with proper Set serialization/deserialization
- Created API service layer `client/lib/api.ts` with functions:
  - `analyzeDuplicates()` - Send files to backend for duplicate analysis
  - `moveToTrash()` / `restoreFromTrash()` - Safe trash operations
  - `getRules()` / `createRule()` / `updateRule()` / `deleteRule()` / `toggleRule()` - Rules CRUD
  - `generatePreview()` / `compareFiles()` - File preview operations
- Updated Scan page to connect to backend API for real duplicate detection
- Updated Dashboard to display real statistics from scan results
- Updated Rules page to fetch/persist rules via backend API

### Design Note: Web-Based Application
This is a web-based application running in a browser. Unlike desktop applications, browsers cannot directly access the user's local file system. The scan feature uses demo file generation to demonstrate the duplicate detection workflow. In a production desktop environment, this would connect to a native file scanner.

### Initial Setup from GitHub Import
- Installed all dependencies via PNPM (464 packages)
- Updated production server port from 3000 to 5000 in `server/node-build.ts`
- Configured deployment for autoscale with build and run commands
- Verified workflow is running successfully
- Confirmed frontend is accessible and loading properly

### Previous Configuration (Already Present)
- Vite configured for Replit environment (port 5000, HMR via WSS)
- Fixed import errors in notification hooks (sonner import)
- Fixed invalid Lucide icon imports (Toggle2 -> ToggleLeft)
- Fixed TypeScript type narrowing in Rules.tsx
- Added shared types and utilities to `shared/api.ts`:
  - `FileType` type definition
  - `File` interface for duplicate detection
  - `FILE_ICONS` mapping for visual representation
  - `FILE_EXTENSIONS` by category
  - `detectFileType()` utility function
  - `formatFileSize()` utility function
  - `ScanResult`, `DuplicateGroup`, `TrashEntry`, `BatchRule` interfaces

## Status
✅ Application is running and functional
✅ Frontend loads successfully (Splash screen visible)
✅ Backend API is integrated and responding
✅ WebSocket HMR is working
✅ Deployment configuration is complete
✅ All TypeScript errors resolved
✅ Electron desktop conversion completed (December 2024)
✅ Modern Glassmorphism UI design implemented
✅ Cloud AI (OpenAI) integration added

## Desktop Application (Electron)

### New Desktop Features
The project has been converted to support building as a native Windows desktop application:

- **Electron Main Process**: `electron/main.ts` - Desktop app entry point with IPC handlers
- **Preload Script**: `electron/preload.ts` - Secure bridge between frontend and backend
- **Real Backend Engines**:
  - `electron/core/fileScanner.ts` - Real filesystem scanning with recursive directory reading
  - `electron/core/hashEngine.ts` - SHA-256 cryptographic hashing
  - `electron/core/metadataExtractor.ts` - Image/video/audio/document metadata using Sharp, music-metadata, pdf-parse
  - `electron/core/duplicateEngine.ts` - Hash-based duplicate detection with byte-level comparison
  - `electron/core/safeTrash.ts` - Real file-based Safe Trash with restore capability
  - `electron/core/batchRules.ts` - Automated rules engine for duplicate management
  - `electron/core/aiEngine.ts` - AI-powered recommendations and risk assessment
  - `electron/core/cloudAI.ts` - Cloud-based AI using OpenAI GPT-4o for smart recommendations
  - `electron/core/logger.ts` - File-based logging system

### Cloud AI Integration (OpenAI)
The desktop app includes cloud-based AI capabilities using OpenAI's GPT-4o model:
- **Smart Group Analysis**: Analyzes duplicate groups and recommends which file to keep
- **Cleanup Strategy**: Generates intelligent cleanup strategies based on file analysis
- **Risk Assessment**: Evaluates deletion risk levels (low/medium/high)
- **Natural Language Queries**: Ask questions about your files in natural language
- **Requires**: `OPENAI_API_KEY` environment variable

### Modern Glassmorphism UI Design
The application features a modern glassmorphism design aesthetic:
- **Glass Cards**: Semi-transparent cards with backdrop blur and gradient borders
- **Glass Sidebar**: Blurred navigation with subtle transparency
- **Gradient Backgrounds**: Deep purple/blue gradients with animated elements
- **Glow Effects**: Subtle neon glow on interactive elements
- **Custom CSS Classes**: `glass`, `glass-card`, `glass-sidebar`, `glass-button`, `glass-input`, `gradient-text`, etc.
- **Animated Elements**: Floating animations, shimmer loading states, smooth transitions
- **RTL Support**: Full Arabic language and right-to-left layout support

### Desktop Build Commands
```bash
pnpm build:electron    # Build React + compile Electron
pnpm dist:win          # Create Windows EXE installer
pnpm dist:mac          # Create macOS DMG
pnpm dist:linux        # Create Linux AppImage/deb
```

### Storage Locations (Windows)
- Config: `%APPDATA%/Knoux/config.json`
- Rules: `%APPDATA%/Knoux/rules.json`
- Safe Trash: `%APPDATA%/Knoux/SafeTrash/`
- Logs: `%APPDATA%/Knoux/logs/`

See `DESKTOP_BUILD.md` for complete build instructions.

## Project Features Summary
- **Splash Screen**: Logo + Arabic tagline "الذكاء في التنظيم، لا للتكرار" + Progress bar
- **Onboarding**: 3-step wizard (Folders, File Types, AI Sensitivity)
- **Dashboard**: Stats, File Type Distribution, Quick Tips, Sidebar navigation
- **Scan**: File scanning functionality with duplicate detection
- **Rules**: Create and manage auto-delete rules (Keep Largest, Newest, Best Quality)
- **Settings**: Theme toggle, AI sensitivity, file type selection
- **Help**: Documentation and support information
- **Backend APIs**: Duplicate detection, Safe Trash, Rules management, Preview generation
