import { useState, useEffect } from "react";
import inventoryService from "@/services/InventoryService";
import { KardexEntry } from "@/types/inventory";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  ClipboardList,
  FileDown,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function KardexPage() {
  const { user } = useAuth();
  const [kardexEntries, setKardexEntries] = useState<KardexEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<Warehouse[]>([]);
  
  // For detail dialog
  const [selectedEntry, setSelectedEntry] = useState<KardexEntry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    productId: "",
    warehouseId: "",
    startDate: "",
    endDate: new Date().toISOString(),
  });

  // Load initial data
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // Load products for select options
        const productsData = await inventoryService.getProducts();
        setProductOptions(productsData);
        
        // Load warehouses for select options
        const warehousesData = await inventoryService.getWarehouses();
        setWarehouseOptions(warehousesData);
      } catch (error) {
        console.error("Error loading options:", error);
        toast.error("Error al cargar las opciones de filtro");
      }
    };

    loadOptions();
  }, []);

  const handleSearch = async () => {
    if (!filters.productId) {
      toast.error("Por favor seleccione un producto para consultar el kardex");
      return;
    }

    setLoading(true);
    try {
      const entries = await inventoryService.getKardex({
        productId: filters.productId,
        warehouseId: filters.warehouseId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate,
      });
      
      setKardexEntries(entries);
      
      if (entries.length === 0) {
        toast.info("No se encontraron movimientos para los filtros seleccionados");
      }
    } catch (error) {
      console.error("Error loading kardex:", error);
      toast.error("Error al cargar el kardex");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateSelect = (field: string) => (date: Date | undefined) => {
    if (date) {
      setFilters(prev => ({
        ...prev,
        [field]: date.toISOString()
      }));
    }
  };

  const exportToCSV = () => {
    if (kardexEntries.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    // Get selected product and warehouse names
    const product = productOptions.find(p => p.id === filters.productId)?.name || 'Todos';
    const warehouse = filters.warehouseId 
      ? warehouseOptions.find(w => w.id === filters.warehouseId)?.name 
      : 'Todos';

    try {
      // Create CSV content
      const headers = ["Fecha", "Tipo", "Cantidad", "Stock Anterior", "Stock Actual"];
      const csvRows = [headers];

      // Add data rows
      kardexEntries.forEach(entry => {
        const row = [
          format(parseISO(entry.date), "dd/MM/yyyy HH:mm", { locale: es }),
          entry.type === "ingreso" ? "Ingreso" : "Egreso",
          entry.quantity.toString(),
          entry.previousStock.toString(),
          entry.currentStock.toString(),
        ];
        csvRows.push(row);
      });

      // Convert to CSV string
      const csvContent = csvRows.map(row => row.join(",")).join("\n");
      
      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `kardex_${product}_${warehouse}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Reporte exportado correctamente");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Error al exportar los datos");
    }
  };

  const openDetailDialog = (entry: KardexEntry) => {
    setSelectedEntry(entry);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Kardex</h2>
        <p className="text-muted-foreground">
          Consulta el historial de movimientos por producto y almacén
        </p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="product">Producto *</Label>
            <Select
              value={filters.productId}
              onValueChange={(value) => handleFilterChange("productId", value)}
            >
              <SelectTrigger id="product">
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="warehouse">Almacén</Label>
            <Select
              value={filters.warehouseId}
              onValueChange={(value) => handleFilterChange("warehouseId", value)}
            >
              <SelectTrigger id="warehouse">
                <SelectValue placeholder="Todos los almacenes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los almacenes</SelectItem>
                {warehouseOptions.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startDate">Fecha Desde</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate
                    ? format(parseISO(filters.startDate), "dd/MM/yyyy", { locale: es })
                    : "Sin fecha mínima"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate ? parseISO(filters.startDate) : undefined}
                  onSelect={handleDateSelect("startDate")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endDate">Fecha Hasta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate
                    ? format(parseISO(filters.endDate), "dd/MM/yyyy", { locale: es })
                    : "Fecha actual"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate ? parseISO(filters.endDate) : undefined}
                  onSelect={handleDateSelect("endDate")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setFilters({
            productId: "",
            warehouseId: "",
            startDate: "",
            endDate: new Date().toISOString(),
          })}>
            Limpiar
          </Button>
          <Button onClick={handleSearch} disabled={loading || !filters.productId}>
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Consultando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Consultar
              </>
            )}
          </Button>
        </div>
      </Card>

      {kardexEntries.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Resultados</h3>
            <Button variant="outline" onClick={exportToCSV}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Fecha</TableHead>
                  <TableHead className="w-[100px]">Tipo</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="text-center">Entrada</TableHead>
                  <TableHead className="text-center">Salida</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kardexEntries.map((entry) => (
                  <TableRow 
                    key={entry.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetailDialog(entry)}
                  >
                    <TableCell>
                      {format(parseISO(entry.date), "dd/MM/yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      {entry.type === "ingreso" ? (
                        <div className="flex items-center">
                          <ArrowUpIcon className="mr-1 h-4 w-4 text-emerald-600" />
                          <span>Ingreso</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <ArrowDownIcon className="mr-1 h-4 w-4 text-rose-600" />
                          <span>Egreso</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {entry.movementId}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.type === "ingreso" ? entry.quantity : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.type === "egreso" ? entry.quantity : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {entry.currentStock}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {!loading && kardexEntries.length === 0 && filters.productId && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No hay movimientos para mostrar</h3>
          <p className="text-muted-foreground mt-2">
            No se encontraron registros para los filtros seleccionados.
            <br />
            Intenta con otros criterios de búsqueda.
          </p>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del movimiento</DialogTitle>
            <DialogDescription>
              Información detallada del movimiento de inventario
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo de movimiento</Label>
                  <div className="font-medium mt-1">
                    {selectedEntry.type === "ingreso" ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        Ingreso
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">
                        Egreso
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Fecha y hora</Label>
                  <div className="font-medium mt-1">
                    {format(parseISO(selectedEntry.date), "PPP p", { locale: es })}
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">ID de movimiento</Label>
                  <div className="font-medium mt-1">
                    {selectedEntry.movementId}
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Cantidad</Label>
                  <div className="font-medium mt-1">
                    {selectedEntry.quantity} unidades
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Stock anterior</Label>
                  <div className="font-medium mt-1">
                    {selectedEntry.previousStock} unidades
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Stock resultante</Label>
                  <div className="font-medium mt-1">
                    {selectedEntry.currentStock} unidades
                  </div>
                </div>
                
                {selectedEntry.unitCost && (
                  <div>
                    <Label className="text-muted-foreground">Costo unitario</Label>
                    <div className="font-medium mt-1">
                      ${selectedEntry.unitCost.toFixed(2)}
                    </div>
                  </div>
                )}
                
                {selectedEntry.lot && (
                  <div>
                    <Label className="text-muted-foreground">Lote</Label>
                    <div className="font-medium mt-1">
                      {selectedEntry.lot}
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="text-muted-foreground">Registrado por</Label>
                  <div className="font-medium mt-1">
                    {selectedEntry.createdBy}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}