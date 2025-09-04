# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Terbium v2** is a web-based operating system built with modern web technologies. It's a complete OS experience running in the browser with:

- Desktop environment with window management
- File system abstraction using FilerJS  
- Application ecosystem with `.tapp` packages
- Compatibility layers for Anura (Liquor) and Electron (Lemonade) apps
- Built-in proxy/transport system using BareMux, Wisp, and Scramjet
- Dynamic shell and terminal emulator

## Development Commands

### Essential Commands
```bash
# Development with hot-reload
npm run dev

# Production build
npm run build

# Start production server (builds first)
npm start

# Start without rebuilding
npm start:nobuild

# Static build (for static hosting)
npm run build-static

# Build only apps.json (for app discovery)
npm run build-apps-json
```

### Code Quality
```bash
# Format and lint with Biome
npm run check

# Format only
npm run fmt

# Manual linting (if needed)
npm run lint
```

### Vite Operations
```bash
# Direct Vite commands
npm run vite        # Start dev server
npm run preview     # Preview production build
```

## Architecture Overview

### Core Structure
- **`bootstrap.ts`** - Main bootstrap process that builds app registry, creates paths, handles updates
- **`server.ts`** - Express server with proxy endpoints, Wisp server integration, optional Masqr authentication
- **`src/main.tsx`** - Application entry point with page routing (Boot → Setup → Login → App)
- **`src/App.tsx`** - Main desktop application wrapper

### Key Systems

#### File System (`src/sys/`)
- **FilerJS Integration**: Browser-based file system abstraction
- **Virtual Paths**: `/home/`, `/system/`, `/apps/` structure
- **Types**: Comprehensive type definitions in `types.ts`

#### Window Management (`src/sys/Store.ts`)
- **WindowConfig**: Window configuration and lifecycle
- **Process Management**: PID/WID generation and tracking
- **Z-Index Management**: Window focus and layering

#### API Layer (`src/sys/Api.ts`)
- **Global `tb` Object**: Main system API accessible to all apps
- **Registry System**: App registration and discovery
- **Theme/Desktop APIs**: Wallpaper, accent colors, dock management
- **Launcher APIs**: Add/remove apps from system

#### Compatibility Layers
- **Liquor** (`src/sys/liquor/`): Anura OS compatibility layer
- **Lemonade** (`src/sys/lemonade/`): Electron API compatibility layer

#### GUI Components (`src/sys/gui/`)
- **Desktop**: Main desktop environment
- **WindowArea**: Window rendering and management  
- **AppIsland**: System tray/status area
- **ContextMenu**: Right-click menus

### App System

#### App Discovery
- Apps located in `public/apps/` with `.tapp` extension
- Each app has `index.json` with metadata and configuration
- Bootstrap process scans and builds `apps.json` registry
- Apps are copied to virtual `/apps/system/` path during build

#### App Structure
```
appname.tapp/
├── index.json          # App metadata and config
├── main.html          # Entry point
├── icon.png           # App icon
└── [other assets]     # App-specific files
```

## Development Guidelines

### Adding New Apps
1. Create `.tapp` folder in `public/apps/`
2. Add `index.json` with required metadata:
   ```json
   {
     "name": "AppName",
     "config": {
       "title": "App Title",
       "icon": "/apps/appname.tapp/icon.png",
       "src": "/apps/appname.tapp/main.html"
     }
   }
   ```
3. Run `npm run build-apps-json` to update registry

### Working with the File System
- Use `window.Filer.fs` for file operations
- Check existence with `fileExists()` or `dirExists()` helpers
- Standard POSIX-like paths: `/home/username/`, `/system/etc/`

### Window Management
- Use `tb.window.create(config)` to spawn windows
- PID/WID automatically generated via Store.ts
- Window configs support: title, icon, src, size, position, resizable, etc.

### System Integration  
- Register with `tb.registry` for system-wide access
- Use `tb.launcher` APIs for app management
- Theme integration via `tb.desktop.preferences`

### Transport/Proxy System
The project includes multiple proxy transport layers:
- **Wisp**: WebSocket transport (`/wisp/`)
- **BareMux**: Multiplexed proxy system (`/baremux/`)
- **Epoxy**: Transport implementation (`/epoxy/`)
- **Libcurl**: Native curl transport (`/libcurl/`)
- **Scramjet**: Service worker proxy (`/service/`)

### Code Style
- **Biome** for formatting and linting (4 spaces, line width 320)
- **TypeScript** with SolidJS JSX
- **Tab indentation** (configured in biome.json)

## Important Files

### Configuration
- `biome.json` - Code formatting and linting rules
- `vite.config.ts` - Build configuration with transport plugins
- `tsconfig.json` - TypeScript configuration
- `.env` - Server configuration (port, masqr settings)

### System Files  
- `src/sys/types.ts` - Core type definitions
- `src/sys/Api.ts` - Main system API implementation
- `src/apps.json` - Generated app registry (don't edit manually)
- `src/installer.json` - Generated app file paths (don't edit manually)

### Build Outputs
- `build/` - Build artifacts
- `dist/` - Production build output
- Files are auto-generated during bootstrap process

## Environment Requirements

- **Node.js**: >= 20.0.0 (specified in package.json)
- **Bun**: >= 1.2.0 (alternative runtime)
- **Package Manager**: npm or pnpm recommended

## Testing

The project uses GitHub Actions for build verification:
- Checkout → Setup Node 22 → Install deps → Build static
- No unit tests currently configured
- Manual testing via dev server recommended

## Special Considerations

### Static Hosting
- Use `npm run build-static` for static deployment
- Requires external Wisp server configuration
- See `docs/static-hosting.md` for details

### Masqr Authentication
- Optional authentication layer via `.env` configuration
- Requires license server URL and domain whitelist
- Can be disabled by setting `MASQR=false`

### Updates System  
- Bootstrap checks for updates via GitHub API
- Compares package.json versions
- Auto-pull capability if on matching repository

### Browser Compatibility
- Modern browsers with ES modules support
- Service Worker support required for Scramjet
- WebAssembly support for transport layers
