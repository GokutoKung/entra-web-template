import { createContext, type ReactNode, useContext } from 'react';
import type { AuthConfig } from './config';

export interface LoginRequest {
  scopes: string[];
}

interface AuthConfigValue {
  config: AuthConfig;
  loginRequest: LoginRequest;
}

const AuthConfigContext = createContext<AuthConfigValue | null>(null);

export function AuthConfigProvider({
  config,
  children,
}: {
  config: AuthConfig;
  children: ReactNode;
}) {
  const value: AuthConfigValue = {
    config,
    loginRequest: { scopes: config.scopes },
  };
  return (
    <AuthConfigContext.Provider value={value}>
      {children}
    </AuthConfigContext.Provider>
  );
}

export function useAuthConfig(): AuthConfigValue {
  const value = useContext(AuthConfigContext);
  if (!value) {
    throw new Error('useAuthConfig must be used within an AuthConfigProvider');
  }
  return value;
}
