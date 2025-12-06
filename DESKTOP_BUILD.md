# Knoux Duplicate AI - Desktop Application Build Guide

This document explains how to build and run the Knoux Duplicate AI as a native Windows desktop application.

## Overview

Knoux Duplicate AI has been converted from a web application to a native Electron desktop application with the following real capabilities:

- **Real File System Access**: Reads actual files from your hard drive
- **SHA-256 Hashing**: Computes real cryptographic hashes for duplicate detection
- **Metadata Extraction**: Extracts real metadata from images, videos, audio, and documents
- **Safe Trash System**: Moves files to an isolated trash folder with restore capability
- **Batch Rules Engine**: Applies automated rules to manage duplicates
- **AI Engine**: Provides smart recommendations for duplicate management

## Project Structure

```
/knoux-duplicate-ai
├── /electron                    # Electron main process
│   ├── main.ts                 # Main Electron entry point
│   ├── preload.ts              # Preload script for IPC
│   └── /core                   # Backend engines
│       ├── fileScanner.ts      # Real filesystem scanner
│       ├── hashEngine.ts       # SHA-256 hashing engine
│       ├── metadataExtractor.ts # Image/video/audio metadata
│       ├── duplicateEngine.ts  # Duplicate detection engine
│       ├── safeTrash.ts        # Safe trash management
│       ├── batchRules.ts       # Batch rules engine
│       ├── aiEngine.ts         # AI recommendation engine
│       └── logger.ts           # Logging system
├── /client                     # React frontend (unchanged)
├── /assets                     # App icons and resources
├── electron-builder.yml        # Build configuration
├── tsconfig.electron.json      # TypeScript config for Electron
└── package.json                # Updated with Electron scripts
```

## Prerequisites

Before building the desktop application, you need:

1. **Node.js 18+** installed on your Windows machine
2. **pnpm** package manager (`npm install -g pnpm`)
3. **Windows Build Tools** (for native modules):
   ```bash
   npm install -g windows-build-tools
   ```

## Installation

1. Clone or download the project to your Windows machine
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Approve build scripts (required for sharp and electron):
   ```bash
   pnpm approve-builds
   ```

## Development Mode

To run the application in development mode:

1. Start the Vite dev server:
   ```bash
   pnpm dev
   ```

2. In a separate terminal, start Electron:
   ```bash
   pnpm dev:electron
   ```

## Building for Production

### Build the complete application:

```bash
pnpm build:electron
```

### Create Windows Installer (EXE):

```bash
pnpm dist:win
```

This will generate:
- `release/Knoux Duplicate AI-1.0.0-x64.exe` - NSIS installer
- `release/Knoux Duplicate AI-1.0.0-x64-portable.exe` - Portable version

### Build for other platforms:

```bash
# macOS
pnpm dist:mac

# Linux
pnpm dist:linux
```

## Features Implemented

### 1. Real File Scanner
- Recursive directory scanning
- File type detection (images, videos, audio, documents)
- Metadata extraction (size, dates, extensions)
- System folder exclusion
- Progress reporting

### 2. Hash Engine (SHA-256)
- Real cryptographic hashing
- Streaming for large files
- Hash caching for performance
- Quick hash mode for initial comparison

### 3. Metadata Extractor
- **Images**: Width, height, format, EXIF data (using Sharp)
- **Audio**: Duration, bitrate, codec, artist, album (using music-metadata)
- **Documents**: Page count, word count, author (using pdf-parse)
- **Videos**: Duration, resolution, codec information

### 4. Duplicate Detection Engine
- Hash-based comparison
- Byte-by-byte comparison option
- Sensitivity levels (low/medium/high)
- Similarity scoring
- AI-powered recommendations

### 5. Safe Trash System
- Isolated trash folder in `%APPDATA%/Knoux/SafeTrash`
- File metadata preservation
- Restore to original location
- Auto-cleanup of old entries
- Collision handling for duplicates

### 6. Batch Rules Engine
- Pre-configured rules:
  - Keep largest file
  - Keep newest file
  - Keep best quality
  - Keep by priority path
  - Delete by pattern
- Custom rule creation
- Rule prioritization
- Automatic application

### 7. AI Engine
- Quality scoring for files
- Risk level assessment
- Smart recommendations
- Safety checks before deletion
- Summary generation

## IPC Communication

The application uses Electron's IPC (Inter-Process Communication) for secure communication between the React frontend and Node.js backend:

### Available IPC Channels:

```typescript
// Dialogs
dialog:selectFolder
dialog:selectFiles

// Scanning
scan:start
scan:cancel
scan:progress (event)

// Hashing
hash:calculate
hash:calculateBatch
hash:progress (event)

// Metadata
metadata:extract
metadata:extractBatch

// Duplicates
duplicates:detect
duplicates:compare

// Safe Trash
trash:move
trash:restore
trash:delete
trash:empty
trash:getStatus
trash:getItems

// Rules
rules:getAll
rules:create
rules:update
rules:delete
rules:toggle
rules:apply

// AI
ai:analyze
ai:recommend
ai:getSummary

// Settings
settings:get
settings:set
settings:getAll
settings:reset

// Shell
shell:openPath
shell:showItemInFolder

// System
system:getStats
```

## Configuration Files

### electron-builder.yml
Contains build configuration for:
- Windows (NSIS installer, portable)
- macOS (DMG)
- Linux (AppImage, deb)

### tsconfig.electron.json
TypeScript configuration for compiling Electron main process files.

## Storage Locations

- **Config**: `%APPDATA%/Knoux/config.json`
- **Rules**: `%APPDATA%/Knoux/rules.json`
- **Safe Trash**: `%APPDATA%/Knoux/SafeTrash/`
- **Trash Metadata**: `%APPDATA%/Knoux/trash_metadata.json`
- **Logs**: `%APPDATA%/Knoux/logs/`

## Troubleshooting

### Build Errors

1. **Native module errors**: Run `pnpm approve-builds` and reinstall
2. **Sharp errors**: Make sure you have the correct Visual Studio Build Tools
3. **Electron errors**: Try `pnpm add electron@latest -D`

### Runtime Errors

1. **File access denied**: Run as administrator for system folders
2. **Hash calculation slow**: Enable quick hash mode for initial scan
3. **Memory issues**: Limit concurrent operations in settings

## Security Notes

- The application requests file system permissions for scanning
- Safe Trash uses file-level isolation
- All operations are logged for audit purposes
- No data is sent to external servers

## Next Steps

1. Add Windows context menu integration
2. Implement real-time file watcher
3. Add auto-update system
4. Implement encrypted Safe Trash
5. Add multi-user support

## License

MIT License - See LICENSE file for details.
