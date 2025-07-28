import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthState, User } from "@/types/auth";
import { toast } from "sonner";

// Sample users for local authentication
const DEMO_USERS = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    password: "admin123",
    fullName: "Administrador",
    role: "admin" as const,
  },
  {
    id: "2",
    username: "operador",
    email: "operador@example.com",
    password: "operador123",
    fullName: "Operador",
    role: "operator" as const,
  },
];

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  sendPasswordReset: (email: string) => Promise<boolean>;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>(initialState);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser) as User;
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error("Error parsing stored user:", error);
          localStorage.removeItem("user");
          setState({ ...initialState, isLoading: false });
        }
      } else {
        setState({ ...initialState, isLoading: false });
      }
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // For demonstration purposes, we're using a simple in-memory auth
    const user = DEMO_USERS.find(
      (u) => (u.username === username || u.email === username) && u.password === password
    );

    if (user) {
      // Remove password from user object before storing
      const { password: _, ...safeUser } = user;
      localStorage.setItem("user", JSON.stringify(safeUser));
      
      setState({
        user: safeUser,
        isAuthenticated: true,
        isLoading: false,
      });
      
      toast.success(`Bienvenido, ${safeUser.fullName}`);
      return true;
    }

    toast.error("Credenciales inválidas");
    return false;
  };

  const logout = () => {
    localStorage.removeItem("user");
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    toast.info("Sesión cerrada");
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    // In a real application, this would send a reset email
    const user = DEMO_USERS.find(u => u.email === email);
    
    if (user) {
      toast.success("Enlace de recuperación enviado a tu correo");
      return true;
    }
    
    toast.error("Email no encontrado");
    return false;
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, sendPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};