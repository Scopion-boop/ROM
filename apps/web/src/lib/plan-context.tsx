'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authClient } from './auth-client';

export type PlanName = 'free' | 'pro';

interface PlanState {
    plan: PlanName;
    status: string;
    sessionsThisMonth: number;
    sessionLimit: number;
    loading: boolean;
    refresh: () => void;
}

const PlanContext = createContext<PlanState>({
    plan: 'free',
    status: 'active',
    sessionsThisMonth: 0,
    sessionLimit: 10,
    loading: true,
    refresh: () => {},
});

export function PlanProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<PlanState>({
        plan: 'free',
        status: 'active',
        sessionsThisMonth: 0,
        sessionLimit: 10,
        loading: true,
        refresh: () => {},
    });

    const fetchPlan = useCallback(() => {
        const headers = authClient.getAuthHeaders();
        if (!headers.Authorization) {
            setState((s) => ({ ...s, loading: false }));
            return;
        }
        fetch(`${authClient.apiUrl}/api/billing/subscription`, { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) {
                    setState((s) => ({
                        ...s,
                        plan: data.plan ?? 'free',
                        status: data.status ?? 'active',
                        sessionsThisMonth: data.sessionsThisMonth ?? 0,
                        sessionLimit: data.sessionLimit ?? 10,
                        loading: false,
                    }));
                } else {
                    setState((s) => ({ ...s, loading: false }));
                }
            })
            .catch(() => setState((s) => ({ ...s, loading: false })));
    }, []);

    useEffect(() => {
        setState((s) => ({ ...s, refresh: fetchPlan }));
        fetchPlan();
    }, [fetchPlan]);

    return <PlanContext.Provider value={state}>{children}</PlanContext.Provider>;
}

export function usePlan() {
    return useContext(PlanContext);
}
