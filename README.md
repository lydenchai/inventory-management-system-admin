# Inventory Management System

React (Vite) frontend for Inventory Management System.

## Setup

1. Install dependencies:
	```sh
	npm install
	```
2. Start the development server:
	```sh
	npm run start
	```

## Environment Setup

1. Copy `.env.example` to `.env` and set the backend API URL, e.g.:
   ```
   VITE_API_URL=http://localhost:5001/api
   ```
2. The frontend uses this variable to connect to the backend for all API requests.

## Project Structure

- `src/`
  - `api/` - Domain-specific API modules (`productsApi.ts`, `salesApi.ts`, etc.)
  - `components/ui/` - Generic and reusable UI components (`DataTable`, `PageHeader`, `Dialog`, etc.)
  - `features/` - Domain-specific business logic components and modals grouped by feature
  - `pages/` - Main app pages grouped by domain (`/inventory`, `/purchasing`, `/sales`, etc.)
  - `routes/` - Main application routing configuration
  - `layouts/` - App shell and structural layouts (`Sidebar`, `Navbar`)
  - `contexts/` - React context for authentication, dialogs, badges
  - `hooks/` - Custom hooks (e.g., `useDataFetch`, `useDebounce`)

## Features
- **User Authentication (JWT):** Secure login, token refresh, and profile management.
- **Role-Based Access (RBAC):** UI elements dynamically render based on user permissions (admin, staff, supplier).
- **Core Management:** Complete CRUD for Products, Categories, Suppliers, Users, and Permissions.
- **Inventory & Orders:** Track stocks in/out, manage order requests, approvals, and deliveries.
- **Standardized UI System:** Uses a common `DataTable` and `PageHeader` for consistent layout, loading skeletons, and empty states.
- **Centralized Data Fetching:** `useDataFetch` custom hook handles pagination, debounced searching, and filtering cleanly.
- **Analytics Dashboard:** Visualizing financial summaries, inventory trends, and order stats using Recharts.
- **Activity Logging:** Tracks system events and user actions.
- **Modern Tech Stack:** Vite, React, TailwindCSS, Headless UI, and React Icons.

## Architecture Patterns

### Data Fetching & Tables
The application uses a standardized approach for fetching data and displaying tables:
```javascript
const { data, loading, filters, pagination, updateFilters, updatePage } = useDataFetch(getProducts, { search: "" });

// Search with debounce
const debouncedSearch = useDebounce(searchTerm, 500);

<DataTable columns={columns} data={data} loading={loading} />
```

### Role-Based Access
The frontend checks the user's permissions array (from the JWT or profile API) to show/hide UI elements and restrict routes:
```javascript
const canViewProducts = user?.permission?.permissions?.includes('view_product');
const canCreate = user?.permission?.permissions?.includes('create_product');
```

## Backend
See [inventory-management-system-api](https://github.com/lydenchai/inventory-management-system-api) for backend setup and API details.
