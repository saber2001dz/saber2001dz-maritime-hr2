# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a maritime HR management system built with Next.js 15, focusing on managing personnel records for maritime organizations in Tunisia. The application uses Supabase as the backend database and authentication provider.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run build:standalone` - Build standalone production application (with BUILD_STANDALONE=true)
- `npm start` - Start production server
- `npm start:standalone` - Start standalone production server (node .next/standalone/server.js)
- `npm run lint` - Run ESLint for code quality

## Technology Stack

- **Framework**: Next.js 16 with App Router and Turbopack support
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with SSR
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS 4 with PostCSS
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Organigramme**: D3.js with d3-org-chart for organizational charts
- **Animations**: Motion library, tw-animate-css for CSS animations
- **Toast Notifications**: Sonner
- **State Management**: Zustand for stores
- **Data Fetching**: SWR for client-side data management with caching
- **Theming**: next-themes for dark/light mode support
- **React**: React 19 with React DOM 19
- **React Components**: React Aria Components for accessibility
- **Command Palette**: cmdk for command interface
- **CSS Processing**: PostCSS with Tailwind CSS plugin
- **Development**: TypeScript 5, ESLint 9 with Next.js configuration

## Database Architecture

The application uses a comprehensive employee management schema with these key tables:

- `employees` - Core employee information (personal details, matricule, grade, etc.)
- `employee_grades` - Historical grade changes with dates
- `employee_fonctions` - Employee functions and positions history
- `employee_affectations` - Position assignments and responsibilities
- `employee_contacts` - Contact information and addresses
- `employee_formations` - Training and education records
- `employee_conges` - Leave/vacation management
- `employee_banque` - Banking information
- `employee_sanctions` - Disciplinary records
- `employee_recompenses` - Awards and recognitions
- `employee_absence` - Employee absence records
- `unite` - Organizational units (departments, districts, maritime sectors)
- `unite_category_responsibilities` - Available responsibilities by unit category
- `banque` - Banking institutions reference table
- `users` - Application users with roles

All employee-related tables are linked via foreign keys to the main `employees` table. The `unite` table manages hierarchical organizational structure with three levels (niveau_1, niveau_2, niveau_3) and categorizes units by type and navigation status.

## Proxy Configuration (Next.js 16)

The project uses Next.js 16's new `proxy.ts` file convention (replaces deprecated `middleware.ts`):

- **File**: `proxy.ts` - Root-level proxy configuration
- **Runtime**: Node.js (Edge runtime not supported in Next.js 16 proxy)
- **Function**: `proxy()` - Named export function for request interception
- **Internationalization**: Uses `next-intl` v4.7.0 with `createMiddleware` from `i18n/routing.ts`
- **Authentication**: Integrates Supabase session management via `utils/supabase/middleware.ts`
- **Execution Order**:
  1. Force login page to French locale (`/fr/auth/login`)
  2. Handle internationalization (locale detection and routing)
  3. Update Supabase authentication session
- **Matcher Pattern**: Excludes static files, API routes, and Next.js internals

**Key Files:**
- `proxy.ts` - Main proxy configuration
- `i18n/routing.ts` - Internationalization routing configuration with `defineRouting`
- `utils/supabase/middleware.ts` - Supabase session update logic with caching

## Project Structure

- `app/` - Next.js App Router pages and layouts
  - `dashboard/` - Main application dashboard and management
    - `employees/` - Employee management (table, details, create)
    - `unite/` - Unit/organization management (table, details, create)
      - `organigramme/` - Organizational chart visualization with D3.js
  - `auth/` - Authentication pages
- `components/` - Reusable UI components
  - `ui/` - shadcn/ui component library
  - Custom components: OptimizedImage, AppSidebar, RealtimeStatus, Dashboard charts
  - `employeeDetails/` - Employee detail components with tabs and editing
  - `dashboard/` - Dashboard chart components (BarLeavesChart, EmployeesAreaChart, GenderRadialChart, GradeRadarChart, DashboardContent)
- `lib/` - Utility libraries and configurations
  - `supabase/` - Database client configuration (client.ts, server.ts)
  - `schemas.ts` - Zod validation schemas for forms
  - `selectOptions.ts` - Predefined options for form selects
- `types/` - TypeScript type definitions
  - `database.types.ts` - Auto-generated Supabase types
  - `employeeTable.types.ts` - Employee-specific types
  - `unite.types.ts` - Unit/organization types
  - `agent.ts` - Agent-related types
  - `details_employees.ts` - Employee details types
- `utils/` - Utility functions
  - `employee.utils.ts` - Employee data processing utilities
  - `employee-status.utils.ts` - Employee status utilities
  - `dateUtils.ts` - Date formatting and manipulation utilities
  - `idUtils.ts` - Client-side detection utilities
  - `leave-status-checker.ts` - Leave status validation utilities
  - `supabase/middleware.ts` - Supabase proxy utilities (authentication session management)
- `hooks/` - Custom React hooks
  - `useSupabaseData.ts` - Data fetching hooks
  - `use-realtime.ts` - Real-time data synchronization
  - `useDebounce.ts` - Debouncing utility
  - `use-mobile.ts` - Mobile device detection
  - `use-leave-status-monitor.ts` - Employee leave status monitoring
  - `useEditDialogState.ts` - Dialog state management for editing
  - `useOptimizedApiCalls.ts` - Optimized API calls with caching and retry
  - `useOptimizedCrudOperations.ts` - Optimized CRUD operations for employee data
  - `useDashboardData.ts` - Dashboard data fetching
  - `useDashboardDataOptimized.ts` - Optimized dashboard data with materialized views
  - `useOrgChartData.ts` - Organizational chart data management with SWR
- `stores/` - Zustand state management
  - `realtime-store.ts` - Real-time connection state

## Key Components

- **AppSidebar**: Main navigation sidebar with collapsible icon mode
- **Employee Table**: Real-time employee listing with search and filtering
- **Employee Profile**: Comprehensive employee details with tabbed interface
- **Unit Management**: Organizational unit listing and management system
- **OptimizedImage**: Custom image component with fallback handling
- **Real-time Status**: Connection status indicator for real-time features
- **Authentication**: Protected routes with proxy (Next.js 16)
- **Organizational Chart**: Interactive D3.js-based organizational chart with hierarchical visualization
- **Dashboard Charts**: Multiple chart components for data visualization (area, bar, radial, radar charts)

## Database Client Usage

- Use `lib/supabase/client.ts` for client-side operations
- Use `lib/supabase/server.ts` for server-side operations and proxy
- The client includes real-time authentication setup
- Real-time subscriptions are managed through custom hooks and Zustand stores
- Materialized views for optimized dashboard data (`dashboard_employee_stats`, `dashboard_unite_stats`, `dashboard_affectation_stats`, `dashboard_conges_monthly`, `dashboard_grades_distribution`)
- Custom RPC function `refresh_dashboard_materialized_views` for data refresh

## Form Validation

Forms use Zod schemas defined in `lib/schemas.ts`. The main employee schema (`agentSchema`) includes:
- Personal information validation
- Phone number validation (8 digits for Tunisia)
- File upload validation for photos
- Enum validation for grades, gouvernorats, and other predefined lists

## Data Processing

The application includes specialized data processing utilities:

**Employee Data Processing** (`utils/employee.utils.ts`):
- Latest grade calculation from historical records
- Image fallback logic (custom photo → gender-based default → placeholder)
- Data transformation for display components

**Unit Data Processing** (`types/unite.types.ts`):
- `processUniteData` function for organizational unit transformation
- Handles null values with fallback defaults
- Maintains hierarchical structure (niveau_1, niveau_2, niveau_3)

## Authentication Flow

- Proxy (Next.js 16) handles session management across all routes
- Protected routes redirect to `/auth/login`
- User context maintained throughout the application
- Internationalization managed with next-intl v4.7.0 using `createMiddleware`

## UI Patterns

- Consistent breadcrumb navigation
- Responsive sidebar with icon collapse
- Toast notifications for user feedback (Sonner)
- Skeleton loading states
- Tabbed interfaces for complex data views
- Custom animations with fade-in and slide-up effects
- Mobile-responsive design with mobile detection hooks
- Theme support with next-themes (light/dark mode)
- Command palette interface with cmdk

## Supabase Configuration

Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The database includes:
- Custom function `create_new_employee` for comprehensive employee creation with related data
- Real-time subscriptions for live data updates
- Row Level Security (RLS) policies for data protection
- Optimized queries with proper indexing
- Server-side operations using `@supabase/ssr` for SSR compatibility
- Materialized views for dashboard performance optimization
- Custom RPC functions for data processing and view refresh

## Performance Optimizations

- **Font Loading**: Geist fonts with display swap and preload for optimal loading
- **DNS Prefetch**: Preconnection to Supabase and Google Fonts domains
- **Module Preloading**: Critical JavaScript chunks preloaded
- **Image Optimization**: OptimizedImage component with fallback handling
- **Bundle Analysis**: Standalone build support for production deployments
- **Real-time Optimization**: Zustand store for efficient real-time state management
- **API Optimization**: Caching layer with 5-minute TTL for frequently accessed data
- **CRUD Optimization**: Optimized CRUD operations with retry logic and error handling
- **Request Cancellation**: AbortController for canceling pending requests
- **Parallel Requests**: Batched API calls for improved performance
- **Webpack Optimization**: Advanced code splitting with size limits and vendor chunking (production only)
- **Turbopack Support**: Enhanced development experience with stable Turbopack bundler
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy headers
- **Static Asset Caching**: Aggressive caching for images and fonts (1 year TTL)
- **Image Optimization**: AVIF and WebP formats with optimized device sizes
- **Package Optimization**: Selective package imports for reduced bundle size
- **Cache Management**: Webpack cache with 60-day retention for production builds
- **Standalone Build**: Docker-optimized standalone output for deployment

## Internationalization (i18n)

- **Translations Location**: All Arabic translations MUST be stored in `messages/ar.json`
- **Translation Usage**: Use `useTranslations` hook with `t()` function to access translations
- **Translation Structure**: Organize translations hierarchically (e.g., `dashboard.charts.barChart`)
- **No Hardcoded Translations**: Never hardcode Arabic text directly in components
- **Consistent Pattern**: Follow the existing translation pattern used throughout the application
- **Translation Keys**: Use descriptive, nested keys that reflect the UI structure
- **HARDCODED LABELS REQUIREMENT**: For labels that may cause translation errors or dynamic content issues, always hardcode the translations directly in the code using mapping functions instead of relying on translation files. This ensures stability and prevents missing translation errors.

Example usage:
```tsx
const t = useTranslations()
// Use: t("dashboard.charts.barChart")
// Instead of: "مخطط العمود - أيام الإجازة"

// For dynamic content or error-prone translations, use hardcoded mapping:
const getStatusArabic = (status: string): string => {
  const statusMap: Record<string, string> = {
    "مباشر": "مبـاشــر",
    "غير مباشر": "غير مباشر",
    "Maladie": "مــــرض"
    // ... other mappings
  }
  return statusMap[status] || status || "غير محدد"
}
```

## RTL Font Usage Pattern

When applying fonts in RTL (Right-to-Left) mode, use conditional inline patterns instead of variables for clarity and consistency:

**Correct Pattern**:
```tsx
className={`base-classes ${isRTL ? 'font-noto-naskh-arabic' : ''}`}
```

**Avoid**:
```tsx
// Don't use variable-based approach
const tableNotoFontClass = getTableCellNotoFont(params.locale as Locale)
className={`base-classes ${tableNotoFontClass}`}
```

**Key Points**:
- Always use the conditional pattern `${isRTL ? 'font-noto-naskh-arabic' : ''}` for Arabic text elements
- Apply this pattern directly in className strings
- Use `font-noto-naskh-arabic` for Noto Naskh Arabic font in RTL mode
- Use `font-geist-sans` for date inputs and other specific cases where Geist font is needed in RTL
- The `isRTL` boolean is typically derived from `params.locale === "ar"`

**Example Usage**:
```tsx
// Table cell
<td className={`px-4 py-2 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>

// Select component
<SelectTrigger className={`w-full ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>

// DateInput with special case
<DateInput
  className={`w-full ${isRTL ? "text-right font-geist-sans" : ""} ${isRTL ? 'font-noto-naskh-arabic' : ''}`}
/>
```

## Design Guidelines

- **INTERDICTION STRICTE**: Ne jamais changer ou suggérer de modifications à l'UI ou au design visuel sauf si explicitement demandé
- **PRÉSERVATION OBLIGATOIRE**: Garder la structure actuelle, les animations, la mise en page et l'apparence des composants exactement comme ils sont, sauf instruction contraire
- **COMPOSANTS UI**: Ne pas modifier les composants shadcn/ui, les styles Tailwind CSS, ou les animations existantes
- **RESPECT DU DESIGN**: Maintenir l'identité visuelle et l'expérience utilisateur actuelles
- **MODIFICATIONS AUTORISÉES**: Uniquement sur demande explicite de l'utilisateur avec des instructions claires