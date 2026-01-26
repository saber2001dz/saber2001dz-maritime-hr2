# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a maritime HR management system built with Next.js 16, focusing on managing personnel records for maritime organizations in Tunisia. The application uses Supabase as the backend database and authentication provider.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run build:standalone` - Build standalone production application (with BUILD_STANDALONE=true)
- `npm start` - Start production server
- `npm start:standalone` - Start standalone production server (node .next/standalone/server.js)
- `npm run lint` - Run ESLint for code quality

## Technology Stack

- **Framework**: Next.js 16.1.1 with App Router and Turbopack support
- **Database**: Supabase (PostgreSQL) with @supabase/supabase-js v2.50.0
- **Authentication**: Supabase Auth with SSR (@supabase/ssr v0.8.0)
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS 4 with PostCSS
- **Forms**: React Hook Form v7.57.0 with Zod v3.25.63 validation
- **Charts**: Recharts v2.15.4 for data visualization
- **Animations**: Framer Motion v12.28.1, Motion v12.23.12, tw-animate-css for CSS animations
- **Toast Notifications**: Sonner v2.0.5
- **State Management**: Zustand v5.0.6 for stores
- **Data Fetching**: SWR v2.3.4 for client-side data management with caching
- **Theming**: next-themes v0.4.6 for dark/light mode support
- **React**: React 19.1.1 with React DOM 19.1.1
- **React Components**: React Aria Components v1.12.1 for accessibility
- **Date Handling**: @internationalized/date v3.8.2 for date inputs
- **Command Palette**: cmdk v1.1.1 for command interface
- **Icons**: Lucide React v0.511.0, Radix Icons, MUI Icons
- **Excel Export**: xlsx v0.18.5 for spreadsheet generation
- **PDF Generation**: @ag-media/react-pdf-table v2.0.3
- **RTL Support**: stylis v4.3.6 with stylis-plugin-rtl v2.1.1
- **MUI Components**: @mui/material v7.3.1 with Emotion styling
- **CSS Processing**: PostCSS with @tailwindcss/postcss v4
- **Development**: TypeScript 5, ESLint 9 with Next.js configuration

## Database Architecture

The application uses a comprehensive employee management schema with these key tables:

### Core Employee Tables
- `employees` (57 rows) - Core employee information with fields:
  - Personal: prenom, nom, matricule, date_naissance, lieu_naissance, sexe, cin, passeport
  - Family: prenom_pere, prenom_grand_pere, mere
  - Professional: grade_actuel, date_grade, unite_actuelle, type_unite, responsabilite_actuelle
  - Status: actif (enum: مباشر, غير مباشر, إجازة, مرض, أمومة, تدريب, متغيب, موقوف, متقاعد, etc.)
  - Retirement: date_retraite, prolongation_retraite
  - Metadata: created_at, updated_at, prive, hierarchy_level

### Employee Related Tables
- `employee_grades` (67 rows) - Historical grade changes with dates and references
- `employee_fonctions` (23 rows) - Employee functions and positions history
- `employee_affectations` (51 rows) - Position assignments with responsibilities, links to `responsibilities_hierarchy`
- `employee_contacts` (28 rows) - Contact information (email, phones, addresses, gouvernorats)
- `employee_formations` (5 rows) - Training records (lieu, type, etablissement, diplome)
- `employee_conges` (51 rows) - Leave management with type_conge enum (سنوية, مرض, طارئة, زواج, أمومة, بدون راتب, إجازة تقاعد)
- `employee_banque` (19 rows) - Banking information (banque, agence, rib, logo_url, compte_statut)
- `employee_sanctions` (7 rows) - Disciplinary records with type, date, autorite, motif, duree
- `employee_recompenses` (7 rows) - Awards and recognitions
- `employee_absence` (36 rows) - Employee absence records with duree and references
- `employee_photos` (17 rows) - Employee photos stored in Supabase Storage
- `employee_etat_civil` (37 rows) - Marital status with spouse information
- `employee_enfants` (11 rows) - Children records with niveau_scolaire
- `employee_urgent_contacts` (3 rows) - Emergency contact information
- `employee_parcours_scolaire` (3 rows) - Educational background
- `employee_note_annuelle` (8 rows) - Annual performance notes
- `employee_rendement` (5 rows) - Quarterly performance ratings

### Mutation System (Employee Transfer Requests)
- `employee_mutations` (4 rows) - Mutation request records with:
  - employee_id, matricule, prenom_nom, grade
  - unite_actuelle, date_affectation, causes
- `mutation_unites` (12 rows) - Destination units for mutations with:
  - mutation_id, gouvernorat, direction, unite
  - ordre_saisie (1-6) - Preserves exact order of user entry

### Organizational Structure
- `unite` (2588 rows) - Organizational units with hierarchical structure:
  - Hierarchy: niveau_1 (direction_enum), niveau_2, niveau_3, niveau_4
  - Categories: unite_categorie (categorie_unite_enum) - 35+ unit types
  - Details: unite_matricule, unite_classe, unite_description
  - Contact: unite_telephone1/2/3, unite_email, unite_indicatif
  - Location: unite_adresse, unite_port, unite_gps, unite_batiment
  - Management: unite_responsable (FK to employees), unite_rang, navigante
- `unite_photos` (4 rows) - Unit photos with descriptions
- `unite_category_responsibilities` (20 rows) - Available responsibilities by unit category
- `responsibilities_hierarchy` (17 rows) - Responsibility hierarchy with levels (10-100)

### Reference Tables
- `banque` (24 rows) - Banking institutions reference (banque_nom, banque_logo)
- `users` (2 rows) - Application users with roles (admin, hr_manager, employee)

### Statistics Tables
- `employee_statistics` (192 rows) - Historical employee statistics by period (daily, monthly, yearly)

### Database Enums
- `employee_status`: مباشر, غير مباشر, إجازة, مرض, أمومة, تدريب, متغيب, موقوف, متقاعد, etc.
- `type_conge_enum`: سنوية, مرض, طارئة, زواج, أمومة, بدون راتب, إجازة تقاعد
- `etat_civil`: أعزب, عزباء, متزوج, متزوجة, مطلق, مطلقة, أرمل, أرملة
- `direction_enum`: إدارة حرس السواحل, إقليم الحرس البحري بالشمال/بالساحل/بالوسط/بالجنوب, الإدارة العامة لحرس الحدود
- `categorie_unite_enum`: 35+ categories (إدارة, إقليم بحري, منطقة بحرية, طوافة, خافرة, زورق, مركز, فرقة, etc.)

All employee-related tables are linked via foreign keys to the main `employees` table. The `unite` table manages hierarchical organizational structure with four levels (niveau_1, niveau_2, niveau_3, niveau_4) and categorizes units by type and navigation status.

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
  - `[locale]/` - Internationalized routes (ar, fr)
    - `dashboard/` - Main application dashboard and management
      - `employees/` - Employee management
        - `table/` - Employee listing (SimpleEmployeeTable.tsx)
        - `search/` - Employee search (SearchEmployeeClient.tsx)
        - `details/[id]/` - Employee profile (SimpleEmployeeProfile.tsx)
        - `nouveau/` - Create new employee
        - `retraite/` - Retirement management (SimpleRetraiteTable.tsx)
        - `mutations/` - **NEW**: Employee transfer requests
          - `demande/` - Mutation request form (multi-step)
          - `table-mutations/` - Mutations list (SimpleMutationsTable.tsx, MutationUnitesPopover.tsx)
      - `unite/` - Unit/organization management
        - `table/` - Unit listing (SimpleUniteTable.tsx)
        - `details/[id]/` - Unit details (SimpleUniteDetails.tsx)
        - `nouveau/` - Create new unit
        - `organigramme/` - Organizational chart (OrganigrammeTableClient.tsx)
    - `auth/` - Authentication pages (login, logout)
- `components/` - Reusable UI components
  - `ui/` - shadcn/ui component library (40+ components)
  - `employeeDetails/` - Employee detail components
    - `tabs/` - View tabs (TabPersonalInfo, TabProfessionalInfo, TabFamilyInfo, TabTrainingInfo, TabDisciplineInfo, TabLeavesInfo)
    - `tabsEdit/` - Edit tabs with corresponding edit dialogs
  - `dashboard/` - Dashboard chart components
    - `DashboardContent.tsx` - Main dashboard layout
    - `BarLeavesChart.tsx` - Leave days bar chart
    - `EmployeesAreaChart.tsx` - Employee statistics area chart
    - `GenderRadialChart.tsx` - Gender distribution radial chart
    - `GradeRadarChart.tsx` - Grade distribution radar chart
    - `AbsentEmployeesPopover.tsx` - Absent employees details
    - `SuspendedEmployeesPopover.tsx` - Suspended employees details
    - `CongesByTypePopover.tsx` - Leave by type breakdown
  - `motion-primitives/` - Animation components (animated-number.tsx)
  - Core components: OptimizedImage, AppSidebar, nav-main, user-avatar-profile, user-nav, login-form, language-selector, theme-provider, realtime-status, notifications
- `lib/` - Utility libraries and configurations
  - `supabase/` - Database client configuration (client.ts, server.ts)
  - `schemas.ts` - Zod validation schemas for forms
  - `selectOptions.ts` - Predefined options (gouvernorats, grades, genders, blood types)
  - `direction.ts` - RTL/LTR utilities with 15+ font helper functions
  - `mui-rtl-config.ts` - Material UI RTL configuration
  - `types.ts` - Locale type definition
  - `utils.ts` - General utility functions
- `types/` - TypeScript type definitions
  - `database.types.ts` - Auto-generated Supabase types
  - `mutation.types.ts` - **NEW**: Mutation request types and processing
  - `employeeTable.types.ts` - Employee-specific types
  - `unite.types.ts` - Unit/organization types
  - `agent.ts` - Agent-related types
  - `details_employees.ts` - Employee details types
  - `dashboard/` - Dashboard-specific types (index.ts, dashboard.types.ts, trends.types.ts)
- `utils/` - Utility functions
  - `employee.utils.ts` - Employee data processing utilities
  - `employee-status.utils.ts` - Employee status utilities
  - `dateUtils.ts` - Date formatting and manipulation utilities
  - `idUtils.ts` - Client-side detection utilities
  - `leave-status-checker.ts` - Leave status validation utilities
  - `orgchart.utils.ts` - Organizational chart utilities
  - `unit-tree.utils.ts` - Unit hierarchy utilities
  - `supabase/middleware.ts` - Supabase proxy utilities (authentication session management)
  - `dashboard/trend-calculator.utils.ts` - Trend calculation utilities
- `hooks/` - Custom React hooks
  - `dashboard/` - Dashboard-specific hooks
    - `useDashboardData.ts` - Complete dashboard data fetching
    - `useDashboardDataOptimized.ts` - Optimized with materialized views
    - `useAbsentEmployees.ts` - Absent employees data
    - `useAbsentEmployeesTrend.ts` - Absence trends
    - `useCongesByType.ts` - Leave by type statistics
    - `useCongesEmployeesTrend.ts` - Leave trends
    - `useEmployeeMonthlyStats.ts` - Monthly statistics
    - `useSuspendedEmployees.ts` - Suspended employees data
  - `useSupabaseData.ts` - Generic data fetching hooks
  - `use-realtime.ts` - Real-time data synchronization
  - `useDebounce.ts` - Debouncing utility
  - `use-mobile.ts` - Mobile device detection
  - `use-leave-status-monitor.ts` - Employee leave status monitoring
  - `useEditDialogState.ts` - Dialog state management for editing
  - `useOptimizedApiCalls.ts` - Optimized API calls with caching and retry
  - `useOptimizedCrudOperations.ts` - Optimized CRUD operations for employee data
  - `useOrgChartData.ts` - Organizational chart data management with SWR
- `stores/` - Zustand state management
  - `realtime-store.ts` - Real-time connection state
- `messages/` - Internationalization
  - `ar.json` - Arabic translations
  - `fr.json` - French translations
- `supabase/migrations/` - Database migrations
  - `20260124130415_add_ordre_saisie_to_mutation_unites.sql` - Adds ordre_saisie column

## Key Components

- **AppSidebar**: Main navigation sidebar with collapsible icon mode
- **Employee Table**: Real-time employee listing with search, filtering, and Excel export
- **Employee Profile**: Comprehensive employee details with 6 tabbed interfaces and editing dialogs
- **Unit Management**: Organizational unit listing and management system
- **Mutations System**: **NEW** - Employee transfer request management with multi-step form
- **OptimizedImage**: Custom image component with fallback handling
- **Real-time Status**: Connection status indicator for real-time features
- **Authentication**: Protected routes with proxy (Next.js 16)
- **Organizational Chart**: Interactive D3.js-based organizational chart with hierarchical visualization
- **Dashboard Charts**: Multiple chart components for data visualization (area, bar, radial, radar charts)
- **Searchable Select**: Custom searchable dropdown component for large option lists

## Database Client Usage

- Use `lib/supabase/client.ts` for client-side operations
- Use `lib/supabase/server.ts` for server-side operations and proxy
- The client includes real-time authentication setup
- Real-time subscriptions are managed through custom hooks and Zustand stores
- Materialized views for optimized dashboard data (`dashboard_employee_stats`, `dashboard_unite_stats`, `dashboard_affectation_stats`, `dashboard_conges_monthly`, `dashboard_grades_distribution`)
- Custom RPC function `refresh_dashboard_materialized_views` for data refresh
- All tables have RLS (Row Level Security) enabled

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
- Maintains hierarchical structure (niveau_1, niveau_2, niveau_3, niveau_4)

**Mutation Data Processing** (`types/mutation.types.ts`):
- `RawMutationData` - Raw database structure
- `DisplayMutation` - Display format with processed data
- `processMutationData()` - Data transformation function
- `MUTATION_SELECT_QUERY` - Supabase query string

## Authentication Flow

- Proxy (Next.js 16) handles session management across all routes
- Protected routes redirect to `/auth/login`
- User context maintained throughout the application
- Internationalization managed with next-intl v4.7.0 using `createMiddleware`
- User roles: admin, hr_manager, employee

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
- Session storage for highlighting and scroll restoration
- Pagination with highlighted item tracking

## Supabase Configuration

Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The database includes:
- Custom function `create_new_employee` for comprehensive employee creation with related data
- Real-time subscriptions for live data updates
- Row Level Security (RLS) policies on all tables for data protection
- Optimized queries with proper indexing
- Server-side operations using `@supabase/ssr` for SSR compatibility
- Materialized views for dashboard performance optimization
- Custom RPC functions for data processing and view refresh
- Autovacuum optimization on high-update tables
- Triggers for automatic data synchronization (e.g., unite_responsable, responsabilite_actuelle)

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

## Mutations Feature

The mutations system handles employee transfer requests with the following structure:

**Database Tables**:
- `employee_mutations` - Main mutation request with employee info, current unit, causes
- `mutation_unites` - Destination units with ordre_saisie (1-6) preserving entry order

**Components**:
- `demande/page.tsx` - Multi-step form:
  - Step 1: Employee information (matricule, name, grade, current assignment, reasons)
  - Step 2: Table for 3 gouvernorats × 2 units each (6 unit preferences)
- `SimpleMutationsTable.tsx` - List with search, pagination, delete, Excel export
- `MutationUnitesPopover.tsx` - View requested units organized by gouvernorat

**Features**:
- Order preservation for unit preferences (ordre_saisie column)
- Session storage for highlighting and scroll restoration
- Real-time updates
- Bulk export to Excel

## Design Guidelines

- **INTERDICTION STRICTE**: Ne jamais changer ou suggérer de modifications à l'UI ou au design visuel sauf si explicitement demandé
- **PRÉSERVATION OBLIGATOIRE**: Garder la structure actuelle, les animations, la mise en page et l'apparence des composants exactement comme ils sont, sauf instruction contraire
- **COMPOSANTS UI**: Ne pas modifier les composants shadcn/ui, les styles Tailwind CSS, ou les animations existantes
- **RESPECT DU DESIGN**: Maintenir l'identité visuelle et l'expérience utilisateur actuelles
- **MODIFICATIONS AUTORISÉES**: Uniquement sur demande explicite de l'utilisateur avec des instructions claires
