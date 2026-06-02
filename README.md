# IMS-G6 Frontend

React (Vite) frontend for Inventory Management System (Group 6).

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
  - `components/` - Reusable UI components
  - `pages/` - Main app pages (Dashboard, Products, Order Requests, etc.)
  - `app/` - App shell, layout, navigation
  - `context/` - React context for authentication and global state
  - `api/` - API utility functions

## Features
- User authentication (JWT)
- Role-based access (admin, staff, supplier)
- Product, category, supplier, and order request management
- Inventory and report dashboard
- Responsive, modern UI

## User Login Example

To log in from the frontend, use the login form or call the API directly:

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

On success, the JWT access token is stored (usually in localStorage or context) and used for authenticated requests:

```
Authorization: Bearer <access_token>
```

## Role-Based Access
- The frontend checks the user's permissions array (from the JWT or profile API) to show/hide UI elements and restrict routes.
- Example:
  ```js
  // Check if user can view products
  const canViewProducts = user.permissions.includes('view_product');
  ```

## Backend
See [IMS-G6-backend](https://github.com/SreypokD/IMS_G6_backend) for backend setup and API details.
