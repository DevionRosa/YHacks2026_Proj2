import { useState } from 'react';

export function useTodos() {
    const [todos, setTodos] = useState([]);

    // SENIOR FIX: Capture time and location from the backend response
    const set = (backendTasks) => {
        const formatted = backendTasks.map((t, index) => ({
            id: t.id || index,
            text: t.text,
            time: t.time,        // Added this
            location: t.location, // Added this
            done: t.done || false
        }));
        setTodos(formatted);
    };

    // SENIOR FIX: Allow adding tasks with structured metadata
    const add = (text, time = null, location = null) => {
        if (!text.trim()) return;
        setTodos((prev) => [
            ...prev,
            {
                id: Date.now(),
                text,
                time,
                location,
                done: false
            }
        ]);
    };

    const toggle = (id) => {
        setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    };

    const remove = (id) => {
        setTodos((prev) => prev.filter((t) => t.id !== id));
    };

    return { todos, add, toggle, remove, set };
}