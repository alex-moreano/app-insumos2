export type Role = 'admin' | 'operator';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}