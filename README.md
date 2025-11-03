# EmpireQuest Frontend

A modern React-based frontend for EmpireQuest - A Game Of Space MMORPG.

## Tech Stack

- **Framework**: Vite + React 18 + TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **UI/Styling**: shadcn/ui + Tailwind CSS (dark theme, EVE Online/Planetarion inspired)
- **WebSocket**: laravel-echo + pusher-js
- **Testing**: Vitest + React Testing Library + Playwright (E2E)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 20.19.0+ or 22.12.0+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file (or `.env.local`) in the root directory:

**For local development:**

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
VITE_WS_URL=ws://127.0.0.1:8080
VITE_WS_KEY=o714i1l2lrdflpgv7mwg
```

**For staging (using Pusher):**

```env
VITE_API_URL=https://api-staging.agameof.space/api/v1/
VITE_PUSHER_KEY=33d7245f0190d9d32296
VITE_PUSHER_CLUSTER=eu
VITE_USE_PUSHER=true
```

(WebSocket will use Pusher service for staging)

**For production (using Pusher):**

```env
VITE_API_URL=https://api.agameof.space/api/v1/
VITE_PUSHER_KEY=33d7245f0190d9d32296
VITE_PUSHER_CLUSTER=eu
VITE_USE_PUSHER=true
```

(WebSocket will use Pusher service for production)

**Note:**

- `npm run dev` now uses staging API by default
- Create `.env.staging` file to customize staging configuration
- Use `npm run dev:local` for local development with localhost API

3. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000` and will connect to the staging API (`https://api-staging.agameof.space/api/v1/`) by default.

For local development with a local API:

```bash
npm run dev:local
```

## Project Structure

```
/src
  /api              - RTK Query API endpoints
  /app              - Redux store and slices
  /components       - Reusable UI components
    /ui             - shadcn/ui primitives
    /common         - Common components
    /layout         - Layout components
  /features         - Feature-based modules
    /auth           - Authentication
    /holopad        - Dashboard
    /map            - Universe map
    /planets        - Planet management
    /fleets         - Fleet operations
    /facilities     - Facilities & research
    /signals        - Tachyon signals
    /alliances      - Alliance management
    /mail           - Messaging
    /rankings       - Rankings/Top 100
  /hooks            - Custom React hooks
  /lib              - Utility functions
  /types            - TypeScript type definitions
  /styles           - Global styles
  /tests            - Test files
```

## Available Scripts

- `npm run dev` - Start development server with staging API (uses `.env.staging` or defaults to staging API)
- `npm run dev:local` - Start development server with local API (uses `.env.local` if present, defaults to localhost)
- `npm run dev:staging` - Start development server with staging config (uses `.env.staging`, same as `dev`)
- `npm run build` - Build for production (default mode)
- `npm run build:production` - Build for production environment (explicit)
- `npm run build:staging` - Build for staging environment
- `npm run build:fast:production` - Fast production build (no compression)
- `npm run build:fast:staging` - Fast staging build (no compression)
- `npm run preview` - Preview production build
- `npm run preview:staging` - Preview staging build
- `npm run lint` - Run ESLint

## Deployment

### Production Deployment

Deploy to production server using the deployment script:

```bash
./deploy-production.sh
```

This script will:

1. Check for `.env.production` configuration file
2. Build the frontend with production configuration (`npm run build:production`)
3. Deploy the `dist/` folder to `/var/www/agos-app/current/dist` on the production server
4. Use rsync for efficient file transfer

**Requirements:**

- SSH access to `159.65.16.122` as `root`
- SSH key configured for passwordless login (recommended)
- `.env.production` file with production configuration:
  ```env
  VITE_API_URL=https://api.agameof.space/api/v1/
  VITE_PUSHER_KEY=33d7245f0190d9d32296
  VITE_PUSHER_CLUSTER=eu
  VITE_USE_PUSHER=true
  ```

**Manual production deployment:**

```bash
# Build for production
npm run build:production

# Deploy using rsync
rsync -avz --delete dist/ root@159.65.16.122:/var/www/agos-app/current/dist/
```

### Staging Deployment

Deploy to staging server using the deployment script:

```bash
./deploy-staging.sh
```

This script will:

1. Check for `.env.staging` configuration file
2. Build the frontend with staging configuration (`npm run build:staging`)
3. Deploy the `dist/` folder to `/var/www/agos-app/current/dist` on the staging server
4. Use rsync for efficient file transfer

**Requirements:**

- SSH access to `159.65.16.122` as `root`
- SSH key configured for passwordless login (recommended)
- `.env.staging` file with staging configuration:
  ```env
  VITE_API_URL=https://api-staging.agameof.space/api/v1/
  VITE_PUSHER_KEY=33d7245f0190d9d32296
  VITE_PUSHER_CLUSTER=eu
  VITE_USE_PUSHER=true
  ```

**Manual staging deployment:**

```bash
# Build for staging
npm run build:staging

# Deploy using rsync
rsync -avz --delete dist/ root@159.65.16.122:/var/www/agos-app/current/dist/
```

- `npm run test` - Run unit tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate test coverage
- `npm run test:e2e` - Run E2E tests
- `npm run test:e2e:ui` - Run E2E tests with UI

## Features

- 🔐 Authentication (Login/Register)
- 📊 Holopad Dashboard
- 🌌 Universe Map (4-level navigation)
- 🪐 Planet Management
- 🚀 Fleet Operations
- 🔬 Research & Facilities
- 📡 Tachyon Signals
- 👥 Alliance Management
- 📧 In-game Mail
- 🏆 Rankings

## Development

### Adding New Features

1. Create feature folder under `/src/features`
2. Add API endpoints in `/src/api/endpoints`
3. Add Redux slices if needed in `/src/app/slices`
4. Create components in the feature folder
5. Add routes in `/src/App.tsx`

### Styling

This project uses Tailwind CSS with a custom dark space theme. Key colors:

- `space-dark`: #0a0e14
- `space-darker`: #151922
- `space-cyan`: #00d4ff
- `space-blue`: #4a9eff

### Testing

- Unit tests: `/src/tests/unit`
- Integration tests: `/src/tests/integration`
- E2E tests: `/tests/e2e`

## Deployment

Build the project:

```bash
npm run build
```

The `dist` folder contains the production build ready for static hosting (Netlify, Vercel, S3+CloudFront).

## License

MIT
