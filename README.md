# ReachInbox Email Scheduler

A high-performance, modern outbound campaign sequencing and email scheduling platform built with React 19, TypeScript, Vite, and TanStack React Query.

Designed for growth teams, founders, and revenue operators to craft personalized multi-step email sequences, manage prospective pipelines, schedule delivery windows, and track live engagement metrics with high precision.

---

## Features

- **Executive Outbound Dashboard**: Live momentum charts, weekly send trends, capacity runway, deliverability health indicators, and real-time activity feed.
- **Sequence Orchestration**: Multi-touch email campaigns with configurable delays, personalization tags (`{{firstName}}`, `{{company}}`), and instant draft previews.
- **Campaign Management**: Real-time status toggles (Draft, Running, Paused, Completed), audience segmentation, and key performance indicators (open rates, reply rates).
- **Prospect Directory**: Comprehensive contact management, campaign assignment, engagement history, and lifecycle status tracking (Active, Replied, Bounced, Unsubscribed).
- **Fast Local Execution**: Zero external database setup needed for rapid preview, powered by an optimized reactive state engine and TanStack React Query caching.

---

## Tech Stack

- **Framework**: React 19 + TypeScript 5.9
- **Build Tool**: Vite 7
- **Routing**: Wouter
- **State & Server Cache**: TanStack React Query v5
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design Tokens
- **Icons**: Lucide React

---

## Getting Started

### Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start the Vite development server
npm run dev
```

The application will be accessible at `http://localhost:5173/`.

### Production Build

```bash
# Build the optimized production bundle
npm run build

# Preview the production build locally
npm run preview
```

---

## Project Structure

```
├── public/                 # Static assets & custom favicon
├── src/
│   ├── components/         # Shared UI components (ErrorBoundary, etc.)
│   ├── lib/                # Utilities and styling helpers
│   ├── pages/              # Route views (NotFound, etc.)
│   ├── App.tsx             # Main dashboard, navigation, campaign & prospect views
│   ├── hooks.ts            # Custom React Query data hooks
│   ├── index.css           # Design tokens, keyframe animations & UI styling
│   ├── main.tsx            # Application entrypoint
│   └── store.ts            # Core data store, seed datasets & campaign engine
├── index.html              # Clean semantic HTML template & SEO metadata
├── package.json            # Project manifest & npm scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite bundler configuration
```

---

## License

MIT
