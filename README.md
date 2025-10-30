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

2. Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080
VITE_WS_KEY=empirequest-key
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

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

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
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

