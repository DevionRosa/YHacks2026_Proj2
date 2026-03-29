import { useState, useEffect, useCallback } from 'react';

export function useMommaData() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboard = useCallback(async () => {
        try {
            // Updated to port 8000 for FastAPI
            const res = await fetch('http://127.0.0.1:8000/dashboard-data');
            if (!res.ok) throw new Error('Backend unreachable');
            const json = await res.json();
            setData(json);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const runPipeline = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/sync-emails');
            const json = await res.json();
            // Directly update the briefing in the local state
            setData(prev => ({ ...prev, briefing: json.analysis }));
        } catch (err) {
            setError("Briefing sync failed");
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return { data, loading, error, fetchDashboard, runPipeline };
}