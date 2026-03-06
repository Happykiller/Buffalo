import { useState, useEffect } from 'react';
import IdentifyForm from '../components/IdentifyForm';
import RequestForm from '../components/RequestForm';
import { getRandomTheme, type Theme } from '../themes';

interface User {
    id: string;
    displayName: string;
}

export default function UserPage() {
    const [user, setUser] = useState<User | null>(null);
    const [theme, setTheme] = useState<Theme>(getRandomTheme());

    useEffect(() => {
        const stored = localStorage.getItem('buffalo_user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem('buffalo_user');
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
