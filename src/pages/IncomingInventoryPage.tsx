import { useState, useEffect } from "react";
import inventoryService from "@/services/InventoryService";
import { Movement, MovementLine, Supplier, Warehouse } from "@/types/inventory";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  Ban,
  CalendarIcon,
  Eye,
  PackagePlus,
  PlusCircle,
  Search,
  Trash,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function IncomingInventoryPage() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // For new movement
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [warehouseOptions, setWarehouseOptions] = useState<Warehouse[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<Supplier[]>([]);
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [newMovement, setNewMovement] = useState({
    date: new Date().toISOString(),
    warehouseId: "",
    warehouseName: "",
    supplierId: "",
    supplierName: "",
    lines: [] as MovementLine[],
  });
  
  // For cancellation
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [currentMovement, setCurrentMovement] = useState<Movement | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  // For movement detail
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);

  // For line items in new movement
  const [currentLine, setCurrentLine] = useState({
    productId: "",
    productName: "",
    quantity: 1,
    lot: "",
    expiryDate: "",
    unitCost: 0,
    note: ""
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load incoming movements
        const movementsData = await inventoryService.getMovements("ingreso");
        setMovements(movementsData);
        setFilteredMovements(movementsData);
        
        // Load warehouses for select options
        const warehousesData = await inventoryService.getWarehouses();
        setWarehouseOptions(warehousesData);
        
        // Load suppliers for select options
        const suppliersData = await inventoryService.getSuppliers();
        setSupplierOptions(suppliersData);
        
        // Load products for select options
        const productsData = await inventoryService.getProducts();
        setProductOptions(productsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  
  // Filter movements when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = movements.filter((movement) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          movement.id.toLowerCase().includes(searchLower) ||
          movement.warehouseName.toLowerCase().includes(searchLower) ||
          movement.supplierName?.toLowerCase().includes(searchLower) ||
          movement.lines.some((line) => 
            line.productName.toLowerCase().includes(searchLower)
          )
        );
      });
      setFilteredMovements(filtered);
    } else {
      setFilteredMovements(movements);
    }
  }, [searchTerm, movements]);

  const resetNewMovementForm = () => {
    setNewMovement({
      date: new Date().toISOString(),
      warehouseId: "",
      warehouseName: "",
      supplierId: "",
      supplierName: "",
      lines: [],
    });
    setCurrentLine({
      productId: "",
      productName: "",
      quantity: 1,
      lot: "",
      expiryDate: "",
      unitCost: 0,
      note: ""
    });
  };

  const handleSelectWarehouse = (warehouseId: string) => {
    const warehouse = warehouseOptions.find(w => w.id === warehouseId);
    if (warehouse) {
      setNewMovement(prev => ({
        ...prev,
        warehouseId,
        warehouseName: warehouse.name
      }));
    }
  };

  const handleSelectSupplier = (supplierId: string) => {
    const supplier = supplierOptions.find(s => s.id === supplierId);
    if (supplier) {
      setNewMovement(prev => ({
        ...prev,
        supplierId,
        supplierName: supplier.name
      }));
    }
  };

  const handleSelectProduct = (productId: string) => {
    const product = productOptions.find(p => p.id === productId);
    if (product) {
      setCurrentLine(prev => ({
        ...prev,
        productId,
        productName: product.name
      }));
    }
  };

  const handleDateSelect = (date: Date) => {
    setNewMovement(prev => ({
      ...prev,
      date: date.toISOString()
    }));
  };

  const handleLineChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentLine(prev => ({
      ...prev,
      [name]: name === "quantity" || name === "unitCost" 
        ? parseFloat(value) || 0
        : value
    }));
  };

  const addLineToMovement = () => {
    // Validation
    if (!currentLine.productId || currentLine.quantity <= 0) {
      toast.error("Por favor seleccione un producto y una cantidad válida");
      return;
    }

    // Create a new line with an ID
    const newLine: MovementLine = {
      id: Date.now().toString(),
      ...currentLine
    };

    // Add to lines array
    setNewMovement(prev => ({
      ...prev,
      lines: [...prev.lines, newLine]
    }));

    // Reset current line form
    setCurrentLine({
      productId: "",
      productName: "",
      quantity: 1,
      lot: "",
      expiryDate: "",
      unitCost: 0,
      note: ""
    });
  };

  const removeLineFromMovement = (lineId: string) => {
    setNewMovement(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.id !== lineId)
    }));
  };

  const handleCreateMovement = async () => {
    // Validation
    if (!newMovement.warehouseId || !newMovement.supplierId || newMovement.lines.length === 0) {
      toast.error("Por favor complete todos los campos requeridos e incluya al menos un producto");
      return;
    }

    try {
      // Create the movement
      const createdMovement = await inventoryService.createIncomingMovement({
        ...newMovement,
        type: "ingreso",
        totalItems: newMovement.lines.reduce((sum, line) => sum + line.quantity, 0)
      });

      // Update the list
      setMovements(prev => [createdMovement, ...prev]);
      
      // Close modal and reset form
      setIsCreateModalOpen(false);
      resetNewMovementForm();
      
      toast.success("Ingreso registrado correctamente");
    } catch (error) {
      console.error("Error creating movement:", error);
      toast.error("Error al crear el ingreso");
    }
  };

  const openCancelDialog = (movement: Movement) => {
    setCurrentMovement(movement);
    setIsCancelDialogOpen(true);
  };

  const handleCancelMovement = async () => {
    if (!currentMovement || !cancellationReason) {
      toast.error("Por favor ingrese un motivo de anulación");
      return;
    }

    try {
      const cancelledMovement = await inventoryService.cancelMovement(
        currentMovement.id, 
        cancellationReason
      );
      
      if (cancelledMovement) {
        // Update the movement in the list
        setMovements(prev => 
          prev.map(m => m.id === currentMovement.id ? cancelledMovement : m)
        );
        
        toast.success("Ingreso anulado correctamente");
        setIsCancelDialogOpen(false);
        setCancellationReason("");
      }
    } catch (error) {
      console.error("Error cancelling movement:", error);
      toast.error("Error al anular el ingreso");
    }
  };

  const openDetailModal = (movement: Movement) => {
    setSelectedMovement(movement);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Ingresos de Inventario
        </h2>
        <p className="text-muted-foreground">
          Registro y gestión de ingresos de productos al almacén
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ingresos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Ingreso
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Fecha</TableHead>
              <TableHead>Almacén</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead className="text-center">Productos</TableHead>
              <TableHead className="text-center">Cantidad</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Cargando ingresos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <PackagePlus className="h-8 w-8 mb-2" />
                    <h3 className="font-medium">No se encontraron ingresos</h3>
                    <p>Cree un nuevo ingreso de inventario</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((movement) => (
                <TableRow key={movement.id} className={movement.status === "cancelled" ? "bg-muted/50" : ""}>
                  <TableCell>
                    {format(parseISO(movement.date), "dd/MM/yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>{movement.warehouseName}</TableCell>
                  <TableCell>{movement.supplierName}</TableCell>
                  <TableCell className="text-center">
                    {movement.lines.length}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {movement.totalItems}
                  </TableCell>
                  <TableCell className="text-center">
                    {movement.status === "active" ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-rose-50 text-rose-700 hover:bg-rose-50">
                        Anulado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetailModal(movement)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {movement.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openCancelDialog(movement)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Movement Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        if (!open) resetNewMovementForm();
        setIsCreateModalOpen(open);
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nuevo Ingreso de Inventario</DialogTitle>
            <DialogDescription>
              Complete la información para registrar un nuevo ingreso de productos
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Header Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha de Ingreso</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newMovement.date
                        ? format(parseISO(newMovement.date), "PPP", { locale: es })
                        : "Seleccione una fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newMovement.date ? parseISO(newMovement.date) : undefined}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouse">Almacén</Label>
                <Select
                  value={newMovement.warehouseId}
                  onValueChange={handleSelectWarehouse}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un almacén" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseOptions.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Proveedor</Label>
                <Select
                  value={newMovement.supplierId}
                  onValueChange={handleSelectSupplier}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierOptions.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column - Line Items */}
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>Agregar Productos</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={currentLine.productId}
                    onValueChange={handleSelectProduct}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productOptions.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      name="quantity"
                      type="number"
                      placeholder="Cantidad"
                      min={1}
                      value={currentLine.quantity || ""}
                      onChange={handleLineChange}
                    />
                    <Button type="button" onClick={addLineToMovement} size="icon">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    name="lot"
                    placeholder="Lote (opcional)"
                    value={currentLine.lot}
                    onChange={handleLineChange}
                  />
                  <Input
                    name="unitCost"
                    type="number"
                    placeholder="Costo unitario"
                    min={0}
                    step={0.01}
                    value={currentLine.unitCost || ""}
                    onChange={handleLineChange}
                  />
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Costo</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newMovement.lines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No hay productos agregados
                        </TableCell>
                      </TableRow>
                    ) : (
                      newMovement.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            {line.productName}
                            {line.lot && <div className="text-xs text-muted-foreground">Lote: {line.lot}</div>}
                          </TableCell>
                          <TableCell className="text-right">{line.quantity}</TableCell>
                          <TableCell className="text-right">
                            {line.unitCost ? `$${line.unitCost.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLineFromMovement(line.id)}
                              className="h-8 w-8"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateMovement}
              disabled={!newMovement.warehouseId || !newMovement.supplierId || newMovement.lines.length === 0}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Movement Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular Ingreso</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción anulará el ingreso y revertirá los cambios en el inventario.
              Por favor indique el motivo de la anulación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancellation-reason">Motivo de anulación</Label>
            <Textarea
              id="cancellation-reason"
              placeholder="Ingrese el motivo de anulación"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancellationReason("")}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelMovement}
              disabled={!cancellationReason}
              className="bg-red-600 hover:bg-red-700"
            >
              Anular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Movement Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de Ingreso</DialogTitle>
          </DialogHeader>
          
          {selectedMovement && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Fecha</h4>
                  <p>
                    {format(parseISO(selectedMovement.date), "PPP", { locale: es })}
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Estado</h4>
                  <p>
                    {selectedMovement.status === "active" ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-rose-50 text-rose-700">
                        Anulado
                      </Badge>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Almacén</h4>
                  <p>{selectedMovement.warehouseName}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Proveedor</h4>
                  <p>{selectedMovement.supplierName}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Registrado por</h4>
                  <p>{selectedMovement.createdBy}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Fecha de registro</h4>
                  <p>
                    {format(parseISO(selectedMovement.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
                
                {selectedMovement.status === "cancelled" && (
                  <>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Anulado por</h4>
                      <p>{selectedMovement.updatedBy}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Motivo de anulación</h4>
                      <p>{selectedMovement.cancellationReason}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Costo Unitario</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedMovement.lines.map((line) => (
                      <TableRow key={line.id} className={cn(selectedMovement.status === "cancelled" && "text-muted-foreground")}>
                        <TableCell>{line.productName}</TableCell>
                        <TableCell>{line.lot || "-"}</TableCell>
                        <TableCell className="text-right">{line.quantity}</TableCell>
                        <TableCell className="text-right">
                          {line.unitCost ? `$${line.unitCost.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.unitCost 
                            ? `$${(line.quantity * line.unitCost).toFixed(2)}` 
                            : "-"
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} className="font-medium text-right">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {selectedMovement.totalItems}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-medium">
                        {selectedMovement.lines.reduce((sum, line) => {
                          const lineTotal = line.unitCost ? line.quantity * line.unitCost : 0;
                          return sum + lineTotal;
                        }, 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}