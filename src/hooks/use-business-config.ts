"use client";

import { useState, useEffect } from "react";

// In a real app, this would fetch from an API endpoint
// For the foundation, we'll assume the session contains the businessId or we have a context provider
export function useBusinessConfig(businessId: string | null) {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!businessId) {
            setLoading(false);
            return;
        }

        // Mocking API call to fetch effective config
        // In production, you'd call: GET /api/business/[id]/config
        async function fetchConfig() {
            try {
                const response = await fetch(`/api/business/${businessId}/config`);
                const data = await response.json();
                setConfig(data);
            } catch (error) {
                console.error("Failed to fetch business config", error);
            } finally {
                setLoading(false);
            }
        }

        fetchConfig();
    }, [businessId]);

    const isFeatureEnabled = (key: string) => {
        return !!config?.features?.[key];
    };

    const getRule = (key: string, defaultValue?: any) => {
        return config?.rules?.[key] ?? defaultValue;
    };

    return { config, isFeatureEnabled, getRule, loading };
}

export function useFeatureGuard(businessId: string | null, featureKey: string) {
    const { isFeatureEnabled, loading } = useBusinessConfig(businessId);
    return { enabled: isFeatureEnabled(featureKey), loading };
}
