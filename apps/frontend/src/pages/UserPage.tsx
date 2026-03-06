import { useState, useEffect } from 'react';
import IdentifyForm from '../components/IdentifyForm';
import RequestForm from '../components/RequestForm';
import { getRandomTheme, type Theme } from '../themes';
import { USER_STORAGE_KEY } from '../config';

interface User {
    id: string;
    displayName: string;
}

export default function UserPage() {
    const [user, setUser] = useState<User | null>(null);
    const [theme, setTheme] = useState<Theme>(getRandomTheme());

    useEffect(() => {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem(USER_STORAGE_KEY);
            }
        }
    }, []);

    const handleNewTheme = () => {
        setTheme(getRandomTheme());
    };

    if (!user) {
        return <IdentifyForm onIdentified={setUser} />;
    }

    return <RequestForm user={user} theme={theme} onNewTheme={handleNewTheme} />;
}
