import { useState, useEffect } from "react";
import inventoryService from "@/services/InventoryService";
import { format, parseISO, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { StockReportItem, MovementReportItem, RotationReportItem } from "@/types/reports";
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
  BarChart3,
  CalendarIcon,
  FileDown,
  LineChart,
  PackageIcon,
  Search,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

type ReportType = "stock" | "movements" | "rotation";

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>("stock");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<StockReportItem[] | MovementReportItem[] | RotationReportItem[]>([]);
  
  // For filters
  const [filters, setFilters] = useState({
    startDate: subMonths(new Date(), 1).toISOString(), // Default to 1 month ago
    endDate: new Date().toISOString(), // Today
  });

  // Load initial data
  useEffect(() => {
    loadStockReport();
  }, []);

  const loadStockReport = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getStockReport();
      setReportData(data);
      setReportType("stock");
    } catch (error) {
      console.error("Error loading stock report:", error);
      toast.error("Error al cargar el reporte de existencias");
    } finally {
      setLoading(false);
    }
  };

  const loadMovementReport = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getMovementReport(
        filters.startDate,
        filters.endDate
      );
      setReportData(data);
      setReportType("movements");
    } catch (error) {
      console.error("Error loading movement report:", error);
      toast.error("Error al cargar el reporte de movimientos");
    } finally {
      setLoading(false);
    }
  };

  const loadRotationReport = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getInventoryRotationReport(
        filters.startDate,
        filters.endDate
      );
      setReportData(data);
      setReportType("rotation");
    } catch (error) {
      console.error("Error loading rotation report:", error);
      toast.error("Error al cargar el reporte de rotación de inventario");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case "stock":
        loadStockReport();
        break;
      case "movements":
        loadMovementReport();
        break;
      case "rotation":
        loadRotationReport();
        break;
    }
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
    if (reportData.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    try {
      // Create headers based on report type
      let headers: string[] = [];
      if (reportType === "stock") {
        headers = ["Código", "Producto", "Categoría", "Unidad", "Existencia Total"];
      } else if (reportType === "movements") {
        headers = ["Fecha", "Tipo", "ID Movimiento", "Almacén", "Producto", "Cantidad", "Estado"];
      } else {
        headers = ["Código", "Producto", "Categoría", "Stock Actual", "Salidas", "Índice de Rotación"];
      }

      // Create CSV content
      const csvRows = [headers];

      // Add data rows
      reportData.forEach(item => {
        let row: string[] = [];

        if (reportType === "stock") {
          row = [
            item.productCode,
            item.productName,
            item.category,
            item.unit,
            item.totalStock.toString(),
          ];
        } else if (reportType === "movements") {
          row = [
            format(parseISO(item.date), "dd/MM/yyyy", { locale: es }),
            item.type === "ingreso" ? "Ingreso" : "Egreso",
            item.movementId,
            item.warehouseName,
            item.productName,
            item.quantity.toString(),
            item.status === "active" ? "Activo" : "Anulado",
          ];
        } else {
          row = [
            item.productCode,
            item.productName,
            item.category,
            item.currentStock.toString(),
            item.outgoingQuantity.toString(),
            item.rotationIndex.toFixed(2),
          ];
        }

        csvRows.push(row);
      });

      // Convert to CSV string
      const csvContent = csvRows.map(row => row.join(",")).join("\n");
      
      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
        <p className="text-muted-foreground">
          Consulta y exporta reportes del sistema de inventario
        </p>
      </div>

      <Tabs defaultValue="stock" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <PackageIcon className="h-4 w-4" />
            <span>Existencias</span>
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Movimientos</span>
          </TabsTrigger>
          <TabsTrigger value="rotation" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Rotación</span>
          </TabsTrigger>
        </TabsList>

        {/* Stock Report */}
        <TabsContent value="stock">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Reporte de Existencias</CardTitle>
              <Button variant="outline" onClick={exportToCSV} disabled={reportData.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Cargando datos...</span>
                </div>
              ) : reportData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <PackageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No hay productos para mostrar</h3>
                  <p className="text-muted-foreground mt-2">
                    No se encontraron productos en el sistema.
                  </p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead className="text-right">Existencia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.productCode}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right font-medium">
                            {item.totalStock}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movements Report */}
        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Reporte de Movimientos</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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

                <div className="flex items-end">
                  <Button onClick={loadMovementReport} className="w-full">
                    <Search className="mr-2 h-4 w-4" />
                    Consultar
                  </Button>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={exportToCSV} disabled={reportData.length === 0}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Cargando datos...</span>
                </div>
              ) : reportData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No hay movimientos para mostrar</h3>
                  <p className="text-muted-foreground mt-2">
                    No se encontraron movimientos en el rango de fechas seleccionado.
                    <br />
                    Intenta con otro rango de fechas.
                  </p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Almacén</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {format(parseISO(item.date), "dd/MM/yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>
                            {item.type === "ingreso" ? "Ingreso" : "Egreso"}
                          </TableCell>
                          <TableCell>{item.warehouseName}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell>
                            {item.status === "active" ? "Activo" : "Anulado"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rotation Report */}
        <TabsContent value="rotation">
          <Card>
            <CardHeader>
              <CardTitle>Reporte de Rotación de Inventario</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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

                <div className="flex items-end">
                  <Button onClick={loadRotationReport} className="w-full">
                    <Search className="mr-2 h-4 w-4" />
                    Consultar
                  </Button>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={exportToCSV} disabled={reportData.length === 0}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Cargando datos...</span>
                </div>
              ) : reportData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <LineChart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No hay datos para mostrar</h3>
                  <p className="text-muted-foreground mt-2">
                    No se encontraron datos de rotación en el rango de fechas seleccionado.
                    <br />
                    Intenta con otro rango de fechas.
                  </p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Stock Actual</TableHead>
                        <TableHead className="text-right">Salidas</TableHead>
                        <TableHead className="text-right">Índice de Rotación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.productCode}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-right">{item.currentStock}</TableCell>
                          <TableCell className="text-right">{item.outgoingQuantity}</TableCell>
                          <TableCell className="text-right font-medium">
                            {item.rotationIndex.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}