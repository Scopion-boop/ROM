'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authClient } from './auth-client';

interface UserState {
  displayName: string | null;
  email: string | null;
  role: string | null;
  specialty: string | null;
  loading: boolean;
}

const defaultState: UserState = {
  displayName: null,
  email: null,
  role: null,
  specialty: null,
  loading: true,
};

const UserContext = createContext<UserState>(defaultState);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UserState>(defaultState);

  const fetchUser = useCallback(() => {
    if (!authClient.isAuthenticated()) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const headers = authClient.getAuthHeaders();
    fetch(`${authClient.apiUrl}/api/auth/me`, { headers, credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setState({
            displayName: data.displayName ?? null,
            email: data.email ?? null,
            role: data.role ?? null,
            specialty: data.specialty ?? null,
            loading: false,
          });
        } else {
          setState((s) => ({ ...s, loading: false }));
        }
      })
      .catch(() => setState((s) => ({ ...s, loading: false })));
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return <UserContext.Provider value={state}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
