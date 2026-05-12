import { useEffect, useState } from 'react';
import { USER_STORAGE_KEY } from '../config';
import type { User } from '../types/user';

export function readStoredUser(): User | null {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) {
        return null;
    }

    try {
        return JSON.parse(stored) as User;
    } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
        return null;
    }
}

export function storeUser(user: User) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
    localStorage.removeItem(USER_STORAGE_KEY);
}

export function useStoredUser() {
    const [user, setUser] = useState<User | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setUser(readStoredUser());
        setIsReady(true);
    }, []);

    return { user, setUser, isReady };
}
