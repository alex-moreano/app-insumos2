import { 
  Product, 
  Warehouse, 
  Supplier, 
  Movement, 
  KardexEntry, 
  StockSummary 
} from "@/types/inventory";
import { StockReportItem, MovementReportItem, RotationReportItem } from "@/types/reports";

// Sample data for initial load
const initialProducts: Product[] = [
  {
    id: "p1",
    code: "PROD001",
    name: "Monitor LED 24 pulgadas",
    category: "Electrónica",
    unit: "Unidad",
    currentStock: 45,
    createdBy: "admin",
    createdAt: "2025-07-01T10:00:00Z"
  },
  {
    id: "p2",
    code: "PROD002",
    name: "Teclado mecánico",
    category: "Electrónica",
    unit: "Unidad",
    currentStock: 65,
    createdBy: "admin",
    createdAt: "2025-07-01T10:05:00Z"
  },
  {
    id: "p3",
    code: "PROD003",
    name: "Mouse inalámbrico",
    category: "Electrónica",
    unit: "Unidad",
    currentStock: 80,
    createdBy: "admin",
    createdAt: "2025-07-01T10:10:00Z"
  },
  {
    id: "p4",
    code: "PROD004",
    name: "Papel A4",
    category: "Oficina",
    unit: "Paquete",
    currentStock: 120,
    createdBy: "admin",
    createdAt: "2025-07-02T09:00:00Z"
  },
  {
    id: "p5",
    code: "PROD005",
    name: "Grapas",
    category: "Oficina",
    unit: "Caja",
    currentStock: 35,
    createdBy: "admin",
    createdAt: "2025-07-02T09:10:00Z"
  }
];

const initialWarehouses: Warehouse[] = [
  {
    id: "w1",
    name: "Almacén Central",
    location: "Sede Principal",
    description: "Almacén principal de la empresa",
    isActive: true
  },
  {
    id: "w2",
    name: "Almacén Secundario",
    location: "Sucursal Norte",
    description: "Almacén de la sucursal norte",
    isActive: true
  }
];

const initialSuppliers: Supplier[] = [
  {
    id: "s1",
    name: "Tecnología S.A.",
    contactPerson: "Juan Pérez",
    phone: "555-1234",
    email: "info@tecnologiasa.com",
    address: "Av. Principal 123",
    isActive: true
  },
  {
    id: "s2",
    name: "Oficina Total",
    contactPerson: "María López",
    phone: "555-5678",
    email: "ventas@oficinatotal.com",
    address: "Calle Comercial 456",
    isActive: true
  }
];

const initialMovements: Movement[] = [
  {
    id: "m1",
    type: "ingreso",
    date: "2025-07-10T09:00:00Z",
    warehouseId: "w1",
    warehouseName: "Almacén Central",
    supplierId: "s1",
    supplierName: "Tecnología S.A.",
    lines: [
      {
        id: "l1",
        productId: "p1",
        productName: "Monitor LED 24 pulgadas",
        quantity: 20,
        lot: "LOT001",
        unitCost: 150
      },
      {
        id: "l2",
        productId: "p2",
        productName: "Teclado mecánico",
        quantity: 30,
        lot: "LOT002",
        unitCost: 45
      }
    ],
    totalItems: 50,
    createdBy: "admin",
    createdAt: "2025-07-10T09:00:00Z",
    status: "active"
  },
  {
    id: "m2",
    type: "egreso",
    date: "2025-07-15T14:00:00Z",
    warehouseId: "w1",
    warehouseName: "Almacén Central",
    requestedBy: "Departamento de TI",
    lines: [
      {
        id: "l3",
        productId: "p1",
        productName: "Monitor LED 24 pulgadas",
        quantity: 5,
        lot: "LOT001"
      }
    ],
    totalItems: 5,
    createdBy: "admin",
    createdAt: "2025-07-15T14:00:00Z",
    status: "active"
  }
];

const initialKardex: KardexEntry[] = [
  {
    id: "k1",
    date: "2025-07-10T09:00:00Z",
    movementId: "m1",
    type: "ingreso",
    productId: "p1",
    warehouseId: "w1",
    quantity: 20,
    previousStock: 30,
    currentStock: 50,
    lot: "LOT001",
    unitCost: 150,
    createdBy: "admin"
  },
  {
    id: "k2",
    date: "2025-07-10T09:00:00Z",
    movementId: "m1",
    type: "ingreso",
    productId: "p2",
    warehouseId: "w1",
    quantity: 30,
    previousStock: 40,
    currentStock: 70,
    lot: "LOT002",
    unitCost: 45,
    createdBy: "admin"
  },
  {
    id: "k3",
    date: "2025-07-15T14:00:00Z",
    movementId: "m2",
    type: "egreso",
    productId: "p1",
    warehouseId: "w1",
    quantity: 5,
    previousStock: 50,
    currentStock: 45,
    lot: "LOT001",
    createdBy: "admin"
  }
];

// Helper functions
const getStorageItem = <T>(key: string, initialData: T): T => {
  const storedData = localStorage.getItem(key);
  if (storedData) {
    try {
      return JSON.parse(storedData);
    } catch (error) {
      console.error(`Error parsing ${key} from localStorage:`, error);
      return initialData;
    }
  }
  // Initialize if not exist
  localStorage.setItem(key, JSON.stringify(initialData));
  return initialData;
};

const setStorageItem = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Inventory service class
class InventoryService {
  private products: Product[];
  private warehouses: Warehouse[];
  private suppliers: Supplier[];
  private movements: Movement[];
  private kardex: KardexEntry[];

  constructor() {
    // Load data from localStorage or initialize with sample data
    this.products = getStorageItem<Product[]>('products', initialProducts);
    this.warehouses = getStorageItem<Warehouse[]>('warehouses', initialWarehouses);
    this.suppliers = getStorageItem<Supplier[]>('suppliers', initialSuppliers);
    this.movements = getStorageItem<Movement[]>('movements', initialMovements);
    this.kardex = getStorageItem<KardexEntry[]>('kardex', initialKardex);
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return [...this.products];
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return this.products.find(p => p.id === id);
  }

  async createProduct(product: Omit<Product, 'id' | 'createdBy' | 'createdAt' | 'currentStock'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: generateId(),
      currentStock: 0,
      createdBy: 'current_user', // In a real app, this would come from auth context
      createdAt: new Date().toISOString(),
    };
    
    this.products.push(newProduct);
    setStorageItem('products', this.products);
    return newProduct;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product | undefined> {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      const updatedProduct = {
        ...this.products[index],
        ...data,
        updatedBy: 'current_user', // In a real app, this would come from auth context
        updatedAt: new Date().toISOString(),
      };
      this.products[index] = updatedProduct;
      setStorageItem('products', this.products);
      return updatedProduct;
    }
    return undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    // Check if product has movements before deleting
    const hasMovements = this.kardex.some(k => k.productId === id);
    if (hasMovements) {
      return false; // Cannot delete products with movements
    }
    
    const initialLength = this.products.length;
    this.products = this.products.filter(p => p.id !== id);
    setStorageItem('products', this.products);
    return this.products.length < initialLength;
  }

  // Warehouse methods
  async getWarehouses(): Promise<Warehouse[]> {
    return [...this.warehouses];
  }

  async getWarehouseById(id: string): Promise<Warehouse | undefined> {
    return this.warehouses.find(w => w.id === id);
  }

  async createWarehouse(warehouse: Omit<Warehouse, 'id'>): Promise<Warehouse> {
    const newWarehouse: Warehouse = {
      ...warehouse,
      id: generateId()
    };
    
    this.warehouses.push(newWarehouse);
    setStorageItem('warehouses', this.warehouses);
    return newWarehouse;
  }

  async updateWarehouse(id: string, data: Partial<Warehouse>): Promise<Warehouse | undefined> {
    const index = this.warehouses.findIndex(w => w.id === id);
    if (index !== -1) {
      const updatedWarehouse = { ...this.warehouses[index], ...data };
      this.warehouses[index] = updatedWarehouse;
      setStorageItem('warehouses', this.warehouses);
      return updatedWarehouse;
    }
    return undefined;
  }

  // Supplier methods
  async getSuppliers(): Promise<Supplier[]> {
    return [...this.suppliers];
  }

  async getSupplierById(id: string): Promise<Supplier | undefined> {
    return this.suppliers.find(s => s.id === id);
  }

  async createSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const newSupplier: Supplier = {
      ...supplier,
      id: generateId()
    };
    
    this.suppliers.push(newSupplier);
    setStorageItem('suppliers', this.suppliers);
    return newSupplier;
  }

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier | undefined> {
    const index = this.suppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      const updatedSupplier = { ...this.suppliers[index], ...data };
      this.suppliers[index] = updatedSupplier;
      setStorageItem('suppliers', this.suppliers);
      return updatedSupplier;
    }
    return undefined;
  }

  // Movement methods
  async getMovements(type?: "ingreso" | "egreso"): Promise<Movement[]> {
    if (type) {
      return this.movements.filter(m => m.type === type);
    }
    return [...this.movements];
  }

  async getMovementById(id: string): Promise<Movement | undefined> {
    return this.movements.find(m => m.id === id);
  }

  async createIncomingMovement(movement: Omit<Movement, 'id' | 'createdBy' | 'createdAt' | 'status'>): Promise<Movement> {
    // Create the new movement
    const newMovement: Movement = {
      ...movement,
      id: generateId(),
      createdBy: 'current_user', // In a real app, this would come from auth context
      createdAt: new Date().toISOString(),
      status: "active"
    };
    
    this.movements.push(newMovement);
    setStorageItem('movements', this.movements);

    // Update product stock and add to kardex
    for (const line of movement.lines) {
      const product = await this.getProductById(line.productId);
      if (product) {
        const previousStock = product.currentStock;
        const newStock = previousStock + line.quantity;
        
        // Update product stock
        await this.updateProduct(product.id, { currentStock: newStock });
        
        // Add to kardex
        const kardexEntry: KardexEntry = {
          id: generateId(),
          date: movement.date,
          movementId: newMovement.id,
          type: "ingreso",
          productId: line.productId,
          warehouseId: movement.warehouseId,
          quantity: line.quantity,
          previousStock,
          currentStock: newStock,
          lot: line.lot,
          unitCost: line.unitCost,
          createdBy: 'current_user'
        };
        
        this.kardex.push(kardexEntry);
        setStorageItem('kardex', this.kardex);
      }
    }

    return newMovement;
  }

  async createOutgoingMovement(movement: Omit<Movement, 'id' | 'createdBy' | 'createdAt' | 'status'>): Promise<Movement> {
    // Check if there's enough stock for each product
    for (const line of movement.lines) {
      const product = await this.getProductById(line.productId);
      if (!product || product.currentStock < line.quantity) {
        throw new Error(`No hay suficiente stock para ${line.productName}`);
      }
    }

    // Create the new movement
    const newMovement: Movement = {
      ...movement,
      id: generateId(),
      createdBy: 'current_user', // In a real app, this would come from auth context
      createdAt: new Date().toISOString(),
      status: "active"
    };
    
    this.movements.push(newMovement);
    setStorageItem('movements', this.movements);

    // Update product stock and add to kardex
    for (const line of movement.lines) {
      const product = await this.getProductById(line.productId);
      if (product) {
        const previousStock = product.currentStock;
        const newStock = previousStock - line.quantity;
        
        // Update product stock
        await this.updateProduct(product.id, { currentStock: newStock });
        
        // Add to kardex
        const kardexEntry: KardexEntry = {
          id: generateId(),
          date: movement.date,
          movementId: newMovement.id,
          type: "egreso",
          productId: line.productId,
          warehouseId: movement.warehouseId,
          quantity: line.quantity,
          previousStock,
          currentStock: newStock,
          lot: line.lot,
          createdBy: 'current_user'
        };
        
        this.kardex.push(kardexEntry);
        setStorageItem('kardex', this.kardex);
      }
    }

    return newMovement;
  }

  async cancelMovement(id: string, reason: string): Promise<Movement | undefined> {
    const movementIndex = this.movements.findIndex(m => m.id === id && m.status === "active");
    if (movementIndex === -1) {
      return undefined;
    }

    const movement = this.movements[movementIndex];
    
    // Revert stock changes
    for (const line of movement.lines) {
      const product = await this.getProductById(line.productId);
      if (product) {
        let newStock: number;
        
        if (movement.type === "ingreso") {
          // If canceling an incoming movement, decrease stock
          newStock = product.currentStock - line.quantity;
        } else {
          // If canceling an outgoing movement, increase stock
          newStock = product.currentStock + line.quantity;
        }
        
        // Update product stock
        await this.updateProduct(product.id, { currentStock: newStock });
        
        // Add cancellation to kardex
        const kardexEntry: KardexEntry = {
          id: generateId(),
          date: new Date().toISOString(),
          movementId: movement.id,
          type: movement.type === "ingreso" ? "egreso" : "ingreso", // Reverse type for cancellation
          productId: line.productId,
          warehouseId: movement.warehouseId,
          quantity: line.quantity,
          previousStock: product.currentStock,
          currentStock: newStock,
          lot: line.lot,
          createdBy: 'current_user'
        };
        
        this.kardex.push(kardexEntry);
      }
    }

    // Update movement status
    this.movements[movementIndex] = {
      ...movement,
      status: "cancelled",
      cancellationReason: reason,
      updatedBy: 'current_user',
      updatedAt: new Date().toISOString()
    };
    
    setStorageItem('movements', this.movements);
    setStorageItem('kardex', this.kardex);
    
    return this.movements[movementIndex];
  }

  // Kardex methods
  async getKardex(filters: {
    productId?: string;
    warehouseId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<KardexEntry[]> {
    let filtered = [...this.kardex];
    
    if (filters.productId) {
      filtered = filtered.filter(k => k.productId === filters.productId);
    }
    
    if (filters.warehouseId) {
      filtered = filtered.filter(k => k.warehouseId === filters.warehouseId);
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(k => new Date(k.date) >= new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(k => new Date(k.date) <= new Date(filters.endDate));
    }
    
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Stock summary methods
  async getStockSummary(warehouseId?: string): Promise<StockSummary[]> {
    const summary: StockSummary[] = [];
    
    for (const product of this.products) {
      const productKardex = this.kardex
        .filter(k => k.productId === product.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
      // If warehouseId is specified, filter by warehouse
      if (warehouseId) {
        const warehouseEntries = productKardex.filter(k => k.warehouseId === warehouseId);
        if (warehouseEntries.length > 0) {
          const warehouse = this.warehouses.find(w => w.id === warehouseId);
          if (warehouse) {
            const lastMovement = warehouseEntries[0]?.date || '';
            
            // Calculate quantity in this specific warehouse
            let quantity = 0;
            warehouseEntries.forEach(entry => {
              if (entry.type === "ingreso") {
                quantity += entry.quantity;
              } else {
                quantity -= entry.quantity;
              }
            });
            
            summary.push({
              productId: product.id,
              productCode: product.code,
              productName: product.name,
              warehouseId,
              warehouseName: warehouse.name,
              quantity,
              lastMovement
            });
          }
        }
      } else {
        // If no warehouseId, get total across all warehouses
        for (const warehouse of this.warehouses) {
          const warehouseEntries = productKardex.filter(k => k.warehouseId === warehouse.id);
          if (warehouseEntries.length > 0) {
            const lastMovement = warehouseEntries[0]?.date || '';
            
            // Calculate quantity in this specific warehouse
            let quantity = 0;
            warehouseEntries.forEach(entry => {
              if (entry.type === "ingreso") {
                quantity += entry.quantity;
              } else {
                quantity -= entry.quantity;
              }
            });
            
            if (quantity > 0) {
              summary.push({
                productId: product.id,
                productCode: product.code,
                productName: product.name,
                warehouseId: warehouse.id,
                warehouseName: warehouse.name,
                quantity,
                lastMovement
              });
            }
          }
        }
      }
    }
    
    return summary;
  }

  // Report methods
  async getStockReport(): Promise<StockReportItem[]> {
    // Get current stock levels for all products
    return this.products.map(product => ({
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      category: product.category,
      unit: product.unit,
      totalStock: product.currentStock
    }));
  }

  async getMovementReport(startDate: string, endDate: string): Promise<MovementReportItem[]> {
    const filteredMovements = this.movements.filter(
      m => new Date(m.date) >= new Date(startDate) && new Date(m.date) <= new Date(endDate)
    );

    const report: MovementReportItem[] = [];
    
    for (const movement of filteredMovements) {
      for (const line of movement.lines) {
        report.push({
          date: movement.date,
          type: movement.type,
          movementId: movement.id,
          warehouseName: movement.warehouseName,
          productName: line.productName,
          quantity: line.quantity,
          status: movement.status,
          createdBy: movement.createdBy
        });
      }
    }
    
    return report;
  }

  async getInventoryRotationReport(startDate: string, endDate: string): Promise<RotationReportItem[]> {
    const products = await this.getProducts();
    const stockReport = await this.getStockReport();
    
    // Get all movements in the date range
    const movementReport = await this.getMovementReport(startDate, endDate);
    
    // Calculate movement totals per product
    const productMovements = products.map(product => {
      const productStock = stockReport.find(s => s.productId === product.id)?.totalStock || 0;
      
      const outgoingMovements = movementReport
        .filter(m => m.type === "egreso" && m.productName === product.name)
        .reduce((sum, m) => sum + m.quantity, 0);
      
      // Calculate rotation index (outgoing / average stock)
      // Use 0.01 to avoid division by zero
      const averageStock = Math.max(productStock, 0.01);
      const rotationIndex = outgoingMovements / averageStock;
      
      return {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        category: product.category,
        currentStock: productStock,
        outgoingQuantity: outgoingMovements,
        rotationIndex: rotationIndex,
      };
    });
    
    return productMovements;
  }
}

// Create singleton instance
const inventoryService = new InventoryService();
export default inventoryService;