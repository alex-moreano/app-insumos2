import { MovementType } from "./inventory";

export interface StockReportItem {
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  totalStock: number;
}

export interface MovementReportItem {
  date: string;
  type: MovementType;
  movementId: string;
  warehouseName: string;
  productName: string;
  quantity: number;
  status: "active" | "cancelled";
  createdBy: string;
}

export interface RotationReportItem {
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  currentStock: number;
  outgoingQuantity: number;
  rotationIndex: number;
}