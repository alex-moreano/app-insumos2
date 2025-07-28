import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowDownIcon, ArrowUpIcon, BoxIcon, PackageOpen, PackagePlus, TruckIcon } from "lucide-react";

// Mock data for the dashboard
const dashboardData = {
  totalProducts: 287,
  totalStock: 12458,
  totalWarehouses: 5,
  recentMovements: [
    { id: "M001", type: "ingreso", product: "Teclado mecánico", quantity: 50, date: "2025-07-24" },
    { id: "M002", type: "egreso", product: "Monitor 24'", quantity: 12, date: "2025-07-24" },
    { id: "M003", type: "ingreso", product: "Mouse inalámbrico", quantity: 100, date: "2025-07-23" },
    { id: "M004", type: "egreso", product: "Adaptador HDMI", quantity: 25, date: "2025-07-23" },
  ],
  monthlyStats: {
    incomingTotal: 2580,
    outgoingTotal: 1940,
  }
};

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bienvenido, {user?.fullName || "Usuario"}. Aquí tienes un resumen del estado actual del inventario.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Productos
            </CardTitle>
            <BoxIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Productos registrados en el sistema
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Stock Total
            </CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalStock} unidades</div>
            <p className="text-xs text-muted-foreground">
              En todos los almacenes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Mes
            </CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.monthlyStats.incomingTotal}</div>
            <p className="text-xs text-muted-foreground">
              Unidades recibidas este mes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Egresos del Mes
            </CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.monthlyStats.outgoingTotal}</div>
            <p className="text-xs text-muted-foreground">
              Unidades despachadas este mes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Movimientos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.recentMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    {movement.type === "ingreso" ? (
                      <div className="p-1.5 rounded-full bg-emerald-100">
                        <PackagePlus className="h-5 w-5 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-full bg-rose-100">
                        <PackageOpen className="h-5 w-5 text-rose-600" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{movement.product}</div>
                      <div className="text-sm text-muted-foreground">
                        {movement.type === "ingreso" ? "Ingreso" : "Egreso"} de {movement.quantity} unidades
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(movement.date).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs Egresos (Mes)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[250px]">
            <div className="flex items-center justify-center gap-8 w-full h-52">
              <div className="flex flex-col items-center gap-2">
                <div className="h-36 w-16 bg-emerald-500 rounded-t-md relative flex items-end justify-center">
                  <div className="absolute -top-8 text-sm font-medium">
                    {dashboardData.monthlyStats.incomingTotal}
                  </div>
                </div>
                <div className="text-sm font-medium">Ingresos</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="h-28 w-16 bg-rose-500 rounded-t-md relative flex items-end justify-center"
                  style={{ 
                    height: `${(dashboardData.monthlyStats.outgoingTotal / dashboardData.monthlyStats.incomingTotal) * 144}px` 
                  }}
                >
                  <div className="absolute -top-8 text-sm font-medium">
                    {dashboardData.monthlyStats.outgoingTotal}
                  </div>
                </div>
                <div className="text-sm font-medium">Egresos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a 
                href="/ingresos"
                className="flex flex-col items-center p-4 border rounded-md hover:bg-muted transition-colors"
              >
                <PackagePlus className="h-8 w-8 text-emerald-600 mb-2" />
                <span className="font-medium">Ingresos</span>
              </a>
              <a 
                href="/egresos"
                className="flex flex-col items-center p-4 border rounded-md hover:bg-muted transition-colors"
              >
                <PackageOpen className="h-8 w-8 text-rose-600 mb-2" />
                <span className="font-medium">Egresos</span>
              </a>
              <a 
                href="/kardex"
                className="flex flex-col items-center p-4 border rounded-md hover:bg-muted transition-colors"
              >
                <TruckIcon className="h-8 w-8 text-blue-600 mb-2" />
                <span className="font-medium">Kardex</span>
              </a>
              <a 
                href="/reportes"
                className="flex flex-col items-center p-4 border rounded-md hover:bg-muted transition-colors"
              >
                <ArrowUpIcon className="h-8 w-8 text-amber-600 mb-2" />
                <span className="font-medium">Reportes</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}