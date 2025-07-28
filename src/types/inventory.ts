export type ProductCategory = 
  | "Electrónica" 
  | "Oficina" 
  | "Materiales" 
  | "Herramientas" 
  | "Insumos"
  | "Otro";

export type UnitType = 
  | "Unidad" 
  | "Kg" 
  | "Litro" 
  | "Metro" 
  | "Caja" 
  | "Paquete";

export interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  unit: UnitType;
  currentStock: number;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  description?: string;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

export type MovementType = "ingreso" | "egreso";

export interface MovementLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  lot?: string;
  expiryDate?: string;
  unitCost?: number; // Only for ingresos
  note?: string;
}

export interface Movement {
  id: string;
  type: MovementType;
  date: string;
  warehouseId: string;
  warehouseName: string;
  supplierId?: string; // Only for ingresos
  supplierName?: string; // Only for ingresos
  requestedBy?: string; // Only for egresos
  lines: MovementLine[];
  totalItems: number;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  status: "active" | "cancelled";
  cancellationReason?: string;
}

export interface KardexEntry {
  id: string;
  date: string;
  movementId: string;
  type: MovementType;
  productId: string;
  warehouseId: string;
  quantity: number;
  previousStock: number;
  currentStock: number;
  lot?: string;
  unitCost?: number;
  createdBy: string;
}

export interface StockSummary {
  productId: string;
  productCode: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  lastMovement: string;
}