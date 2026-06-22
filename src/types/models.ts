import { OrderStatus, StockType, PaymentStatus, ActionType, RoleType } from "./enums";

export interface Permission {
  id: number;
  name: RoleType | string;
  description: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  permission_id: number;
  permission?: Permission;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  category_id: number;
  category?: Category;
  unit_price: number;
  selling_price: number;
  stock_quantity: number;
  reorder_point: number;
  image_url: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: number;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stock {
  id: number;
  product_id: number;
  product?: Product;
  location_id: number;
  location?: Location;
  type: StockType;
  quantity: number;
  remarks: string;
  user_id: number;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransfer {
  id: number;
  product_id: number;
  product?: Product;
  source_location_id: number;
  source_location?: Location;
  destination_location_id: number;
  destination_location?: Location;
  quantity: number;
  status?: string;
  transfer_date?: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderRequestItem {
  id: number;
  order_request_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderRequest {
  id: number;
  supplier_id: number;
  supplier?: Supplier;
  user_id: number;
  user?: User;
  status: OrderStatus;
  total_amount: number;
  items?: OrderRequestItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: number;
  order_request_id: number;
  order_request?: OrderRequest;
  approved_by: number;
  approver?: User;
  status: OrderStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Sale {
  id: number;
  user_id: number;
  user?: User;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  payment_status: PaymentStatus;
  items?: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  user_id: number;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  user?: User;
  action: ActionType;
  entity_type: string;
  entity_id: number;
  details: any;
  createdAt: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  link: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
