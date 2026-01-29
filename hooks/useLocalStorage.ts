'use client';

import { useState, useEffect } from 'react';

export default function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    // Initialize state once the component is mounted (client-side only) to avoid hydration mismatch
    useEffect(() => {
        try {
            if (typeof window === 'undefined') {
                return;
            }

            const item = window.localStorage.getItem(key);
            if (item) {
                // Parse stored json or if none return initialValue
                const parsed = JSON.parse(item, (key, value) => {
                    // Simple heuristic to revive dates
                    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
                        return new Date(value);
                    }
                    return value;
                });
                setStoredValue(parsed);
            }
        } catch (error) {
            console.log(error);
        }
    }, [key]);

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = (value: T | ((val: T) => T)) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Save state
            setStoredValue(valueToStore);

            // Save to local storage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.log(error);
        }
    };

    return [storedValue, setValue];
}
