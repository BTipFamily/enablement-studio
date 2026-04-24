# Enablement Studio

A comprehensive web application for managing standards, building wizards, and workspace collaboration built with React, Vite, and Tailwind CSS.

## About

Enablement Studio is a modern, feature-rich application designed to streamline project management, standards documentation, and collaborative workspace features. The application provides multiple integrated modules for different aspects of project enablement.

## Features

- **Dashboard** - Overview and key metrics
- **Standards** - Browse and manage standards documentation
- **Build Wizard** - Step-by-step guided workflows
- **Workspace** - Collaborative workspace with code editor and policy management
- **Documentation** - Comprehensive documentation and guides
- **Authentication** - Password-protected access
- **Responsive UI** - Built with Radix UI components and Tailwind CSS

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with Typography plugin
- **UI Components**: Radix UI
- **State Management**: TanStack React Query
- **Routing**: React Router
- **Form Handling**: React Hook Form with Zod validation
- **Linting**: ESLint
- **Type Checking**: TypeScript (JSDoc)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository using the project's Git URL
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create an `.env.local` file in the project root and set the required environment variables:
   ```
   VITE_BASE44_APP_ID=your_app_id
   VITE_BASE44_APP_BASE_URL=your_backend_url
   ```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Building

Build for production:
```bash
npm run build
```

### Other Commands

- **Linting**: `npm run lint`
- **Fix Lint Issues**: `npm run lint:fix`
- **Type Checking**: `npm run typecheck`
- **Preview Production Build**: `npm run preview`

## Project Structure

```
src/
├── pages/              # Page components (Dashboard, Standards, etc.)
├── components/
│   ├── layout/         # Layout components (AppLayout, Sidebar)
│   ├── shared/         # Shared components (CategoryBadge, HealthBadge)
│   ├── ui/             # Radix UI component wrappers
│   └── wizard/         # Wizard-related components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and context (AuthContext, query-client, etc.)
├── api/                # API client configuration
├── utils/              # Helper utilities
└── pages.config.js     # Page configuration

entities/               # Data entity definitions
```

## Authentication

The application uses password-based authentication. Users must enter the access password on the login screen to access the application. Authentication state is managed through the `AuthContext`.

## API Integration

The application connects to a Base44 backend. Configure your API endpoint in the `.env.local` file using `VITE_BASE44_APP_BASE_URL`.

## License

Private project
