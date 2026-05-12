import IdentifyForm from '../components/IdentifyForm';
import RequestForm from '../components/RequestForm';
import { getRandomTheme } from '../themes';
import { useOutletContext } from 'react-router-dom';
import { useStoredUser } from '../hooks/useStoredUser';
import type { UserShellContext } from '../types/user-shell-context';

export default function UserPage() {
    const outletContext = useOutletContext<UserShellContext | undefined>();
    const { user: storedUser, setUser, isReady } = useStoredUser();
    const user = outletContext?.user ?? storedUser;
    const theme = outletContext?.theme ?? getRandomTheme();
    const setTheme = outletContext?.setTheme ?? (() => undefined);

    const handleNewTheme = () => {
        setTheme(getRandomTheme());
    };

    const versionElement = (
        <>
            <a href="/stats" title="Hall of Gloire" style={{ position: 'fixed', bottom: '10px', left: '50%', transform: 'translateX(-50%)', fontSize: '18px', opacity: 0.4, textDecoration: 'none', zIndex: 1000, transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}>
                🏆
            </a>
        </>
    );

    if (!user && isReady) {
        return (
            <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1 }}>
                    <IdentifyForm onIdentified={setUser} />
                </div>
                {versionElement}
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div style={{ position: 'relative', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
                <RequestForm user={user} theme={theme} onNewTheme={handleNewTheme} />
            </div>
            {versionElement}
        </div>
    );
}
