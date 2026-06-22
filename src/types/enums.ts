export enum OrderStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  DELIVERED = "delivered",
  CANCELLED = "cancelled"
}

export enum StockType {
  IN = "IN",
  OUT = "OUT",
  TRANSFER = "TRANSFER"
}

export enum PaymentStatus {
  UNPAID = "unpaid",
  PARTIAL = "partial",
  PAID = "paid"
}

export enum ActionType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LOGIN = "login",
  LOGOUT = "logout"
}

export enum RoleType {
  ADMIN = "admin",
  MANAGER = "manager",
  STAFF = "staff",
  SUPPLIER = "supplier"
}
