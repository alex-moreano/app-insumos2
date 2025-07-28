import { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  BoxIcon,
  ChevronDown,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Menu,
  PackageOpen,
  PackagePlus,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define the navigation items
const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />,
    allowedRoles: ["admin", "operator"],
  },
  {
    name: "Productos",
    href: "/productos",
    icon: <BoxIcon className="h-5 w-5" />,
    allowedRoles: ["admin", "operator"],
  },
  {
    name: "Ingresos",
    href: "/ingresos",
    icon: <PackagePlus className="h-5 w-5" />,
    allowedRoles: ["admin", "operator"],
  },
  {
    name: "Egresos",
    href: "/egresos",
    icon: <PackageOpen className="h-5 w-5" />,
    allowedRoles: ["admin", "operator"],
  },
  {
    name: "Kardex",
    href: "/kardex",
    icon: <ClipboardList className="h-5 w-5" />,
    allowedRoles: ["admin", "operator"],
  },
  {
    name: "Reportes",
    href: "/reportes",
    icon: <BarChart3 className="h-5 w-5" />,
    allowedRoles: ["admin"],
  },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    (item) => user && item.allowedRoles.includes(user.role)
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:static lg:z-auto transform transition-transform duration-200 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <Link to="/dashboard" className="font-semibold text-xl text-primary">
              Gestión Inventario
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {filteredNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                      pathname === item.href
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  <span className="flex-1 text-left overflow-hidden overflow-ellipsis">
                    {user?.fullName || "Usuario"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="mt-1 px-3">
              <Badge variant="outline" className="w-full justify-center">
                {user?.role === "admin" ? "Administrador" : "Operador"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex items-center h-16 px-4 border-b border-border bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-2 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}