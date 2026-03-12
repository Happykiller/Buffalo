import { useState, useEffect } from 'react';
import IdentifyForm from '../components/IdentifyForm';
import RequestForm from '../components/RequestForm';
import UserRequestsBadge from '../components/UserRequestsBadge';
import { getRandomTheme, type Theme } from '../themes';
import { USER_STORAGE_KEY } from '../config';
import { useQuery } from '@apollo/client';
import { GET_BACKEND_VERSION } from '../graphql/queries';
import pkg from '../../package.json';

interface User {
    id: string;
    displayName: string;
}

export default function UserPage() {
    const [user, setUser] = useState<User | null>(null);
    const [theme, setTheme] = useState<Theme>(getRandomTheme());
    const { data: versionData } = useQuery(GET_BACKEND_VERSION);

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

    const versionElement = (
        <>
            {versionData?.backendVersion && (
                <div title="moteur" style={{ position: 'fixed', bottom: '12px', left: '16px', fontSize: '12px', opacity: 0.5, color: '#fff', cursor: 'help', fontFamily: 'var(--font-mono)', zIndex: 1000 }}>
                    v{versionData.backendVersion}
                </div>
            )}
            <div title="web" style={{ position: 'fixed', bottom: '12px', right: '16px', fontSize: '12px', opacity: 0.5, color: '#fff', cursor: 'help', fontFamily: 'var(--font-mono)', zIndex: 1000 }}>
                v{pkg.version}
            </div>
        </>
    );

    if (!user) {
        return (
            <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1 }}>
                    <IdentifyForm onIdentified={setUser} />
                </div>
                {versionElement}
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <UserRequestsBadge user={user} />
            <div style={{ flex: 1 }}>
                <RequestForm user={user} theme={theme} onNewTheme={handleNewTheme} />
            </div>
            {versionElement}
        </div>
    );
}
