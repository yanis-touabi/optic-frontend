# AI Assistant Context — Frontend (`frontend/`)

> **Note for AI Coding Assistants**: Read this file to understand the architecture, tech stack, directory layout, UI state patterns, and coding conventions before working in the `frontend/` codebase.

---

## 1. Project Overview

**Optic Order** is a modern Web ERP application created for optical store owners and opticians to manage their day-to-day operations. The application enables store staff to:
- Navigate dashboard metrics (revenue trends, active orders, top sales, status breakdowns).
- Manage client databases and search client histories.
- Create and manage optometric prescriptions with detailed OD/OG measurements.
- Track inventory of optical frames, lenses, and accessories with stock indicators.
- Create multi-item order forms with real-time stock availability validation and generate printable invoices (*Bons de commande*).
- Perform administrative tasks like approving registered accounts, managing employee roles, and customizing store branding.

---

## 2. Responsibility of the `frontend/` Folder

The `frontend/` folder contains the single-page web application (SPA) built with React and TypeScript. Its primary responsibilities include:
- Rendering a responsive, polished UI with dark/light themes using **Tailwind CSS** and **shadcn/ui**.
- Managing user authentication states, storing JWT tokens securely, and handling authorization routing.
- Communicating with the NestJS backend via **Axios** and managing server-side caching using **TanStack React Query**.
- Providing dynamic forms for complex domain data (e.g., optical prescriptions and multi-line order forms).
- Handling client-side sorting, debounced search filters, server-side pagination controls, and CSV file exports.
- Rendering dedicated print-friendly document layouts for invoices and optical prescriptions.

---

## 3. Tech Stack & Tools

- **Framework**: [React 18](https://react.dev/) with [TypeScript 5.8](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 5](https://vitejs.dev/) (`@vitejs/plugin-react-swc`)
- **Styling & UI Components**:
  - [Tailwind CSS v3](https://tailwindcss.com/) with custom design tokens (`tailwind.config.ts`, `src/index.css`)
  - [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives for dialogs, dropdowns, popovers, comboboxes, selects, tabs)
  - `lucide-react` (icon set)
- **Data Fetching & State Management**:
  - [TanStack React Query v5](https://tanstack.com/query/v5) (`useQuery`, `useMutation`, `useInfiniteQuery`)
  - **Axios** (HTTP client with JWT request interceptor)
- **Routing**: [React Router v6](https://reactrouter.com/) (`BrowserRouter`, `Routes`, `Route`, `Navigate`)
- **Form Validation & Inputs**: `react-hook-form`, `zod`, `@hookform/resolvers`
- **Charts & Visualization**: [Recharts](https://recharts.org/) (`BarChart`, `PieChart`, `ResponsiveContainer`)
- **Notifications**: `sonner` toast alerts + shadcn `Toaster`
- **Print & PDF Generation**: Native `window.print()`, `html2pdf.js`, `react-barcode`
- **Testing**: [Vitest](https://vitest.dev/) with React Testing Library (`src/test/`)

---

## 4. Architecture & Directory Structure

```
frontend/
├── public/                 # Static public assets (logos, favicon)
├── src/
│   ├── main.tsx            # React application mounting point
│   ├── App.tsx             # Main routing setup, Providers (QueryClient, AuthProvider, Toaster)
│   ├── index.css           # Tailwind directives, CSS variables, typography styling
│   │
│   ├── pages/              # Top-level route views
│   │   ├── Index.tsx       # Main dashboard (KPI cards, CA chart, order status pie, recent orders)
│   │   ├── Auth.tsx        # Login & registration authentication page
│   │   ├── Clients.tsx     # Client management (table, search, CRUD dialogs, export)
│   │   ├── Produits.tsx    # Inventory management (table, category filter, CRUD dialogs)
│   │   ├── Ordonnances.tsx # Prescriptions table & optometric form dialogs
│   │   ├── Commandes.tsx   # Orders list table with status, client & date range filters
│   │   ├── CommandeCreate.tsx # Order creation page with line items & stock checks
│   │   ├── CommandeEdit.tsx   # Order editing page (locked fields for non-pending status)
│   │   ├── PrintCommande.tsx  # Printable invoice template (auto-triggers window.print)
│   │   ├── PrintOrdonnance.tsx# Printable prescription template (auto-triggers window.print)
│   │   ├── AdminUsers.tsx  # User administration (user approvals, role & status updates)
│   │   ├── Profile.tsx     # User profile settings & store branding/logo upload
│   │   ├── ResetPassword.tsx# Password reset interface
│   │   └── NotFound.tsx    # 404 fallback page
│   │
│   ├── components/         # Reusable React components
│   │   ├── ui/             # Atomic shadcn/ui components (button, input, dialog, table, card, popover...)
│   │   ├── AppLayout.tsx   # Shell layout with sidebar navigation, header, and store context
│   │   ├── ProtectedRoute.tsx # Route guard component checking authentication and roles
│   │   ├── PageHeader.tsx  # Standardized page title, description, and header actions
│   │   ├── ClientSelect.tsx# Searchable combobox for selecting a client
│   │   ├── OrdonnanceSelect.tsx # Combobox for selecting a client's prescription
│   │   ├── StockAlert.tsx  # Alert banner for stock shortages during order creation
│   │   ├── PasswordChecklist.tsx # Visual password requirements validator
│   │   ├── PaginationControls.tsx # Reusable pagination UI
│   │   └── SortableTableHead.tsx  # Clickable table column header with sort indicators
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useDebounce.ts  # Input debouncing hook (300ms delay default)
│   │   ├── useSortableTable.ts # Sorting state management for tables
│   │   ├── useMobile.tsx   # Viewport breakpoint detection
│   │   └── useToast.ts     # Toast notification hook
│   │
│   ├── lib/                # Core utilities, API client, React Query hooks, and types
│   │   ├── apiClient.ts    # Central Axios instance configured with JWT auth headers
│   │   ├── auth.tsx        # AuthContext and AuthProvider component
│   │   ├── data.ts         # All TanStack React Query hooks (clients, products, orders, etc.)
│   │   ├── format.ts       # Currency formatting (`formatDZD()`), dates, status labels
│   │   ├── types.ts        # TypeScript interfaces for all domain models & API contracts
│   │   ├── stock-validation.ts # Real-time stock validation logic
│   │   ├── password-policy.ts  # Password complexity rules
│   │   ├── csv.ts          # CSV export utility function
│   │   └── utils.ts        # `cn()` helper for merging Tailwind CSS classes
│   │
│   └── test/               # Unit and component test setup (Vitest)
├── components.json         # shadcn/ui configuration file
├── tailwind.config.ts      # Tailwind CSS configuration with design system tokens
├── vite.config.ts          # Vite build config with path aliases (`@/` -> `src/`)
├── vitest.config.ts        # Vitest testing configuration
└── package.json            # Frontend package manifest & script definitions
```

---

## 5. Key Architecture & Data Flow Patterns

### Centralized API Client & Authentication
- `src/lib/apiClient.ts` initializes an Axios client pointing to the backend API URL.
- An Axios request interceptor automatically attaches `Authorization: Bearer <token>` from `localStorage`.
- `AuthProvider` in `src/lib/auth.tsx` manages user session state (`user`, `loading`, `isSuperAdmin`, `isAdmin`) and provides `signIn()` / `signOut()` actions.

### Server State with React Query
- All backend data fetching, creation, updates, and deletions are handled via custom TanStack React Query hooks located in `src/lib/data.ts`.
- **Query Invalidation**: After mutations (e.g., creating a client or updating an order status), mutations invalidate corresponding query keys (e.g., `["clients"]`, `["commandes"]`, `["statistics"]`) to refresh server state seamlessly.

### Path Aliasing
- TypeScript and Vite are configured to resolve `@/` to the `src/` directory (e.g., `import { Button } from "@/components/ui/button"`).

### Dynamic Search & Pagination
- Table views (Clients, Products, Orders, Prescriptions) use server-side pagination and debounced search fields (`useDebounce` with 300ms delay) to minimize redundant network requests.

---

## 6. Coding Conventions & Standards for AI

When generating or editing code in `frontend/`:

1. **UI Component Consistency**:
   - Always reuse established `shadcn/ui` components from `@/components/ui/` rather than adding bare HTML elements.
   - Use the `cn(...)` utility from `@/lib/utils` for conditional CSS class merging.

2. **Localization & Formatting**:
   - The application interface is written in **French** (labels, status badges, buttons, tooltips).
   - Format monetary values using `formatDZD(amount)` from `@/lib/format`.
   - Map order status enums (`EN_ATTENTE`, `EN_TRAITEMENT`, `TERMINEE`, `ANNULEE`) to French labels using `statutLabel`.

3. **Type Safety**:
   - Define or import model interfaces exclusively from `@/lib/types` (e.g., `Client`, `Produit`, `Commande`, `Ordonnance`, `PaginatedResponse<T>`).
   - Avoid using `any` types.

4. **Forms & User Inputs**:
   - Use `react-hook-form` paired with `zod` schema validation for multi-field forms.
   - Validate inventory stock before submitting orders using functions from `@/lib/stock-validation`.

5. **Notifications**:
   - Display success/error toasts using `toast.success(...)` or `toast.error(...)` from `sonner`.

---

## 7. Development & Command Reference

```bash
# Install dependencies
npm install

# Start local development server (runs Vite at http://localhost:8080)
npm run dev

# Run Vitest suite
npm run test

# Lint code with ESLint
npm run lint

# Build production bundle
npm run build

# Build Docker image (from project root)
docker build -f frontend/Dockerfile.frontend -t myapp-frontend:latest ./frontend
```
