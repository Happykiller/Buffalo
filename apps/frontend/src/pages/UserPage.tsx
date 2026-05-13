import IdentifyForm from '../components/IdentifyForm';
import RequestForm from '../components/RequestForm';
import { getRandomTheme } from '../themes';
import { Navigate, useOutletContext } from 'react-router-dom';
import { useStoredUser } from '../hooks/useStoredUser';
import type { UserShellContext } from '../types/user-shell-context';

export default function UserPage() {
    const outletContext = useOutletContext<UserShellContext | undefined>();
    const { user: storedUser, setUser, isReady } = useStoredUser();
    const user = outletContext?.user ?? storedUser;
    const isInsideUserShell = Boolean(outletContext);
    const theme = outletContext?.theme ?? getRandomTheme();
    const setTheme = outletContext?.setTheme ?? (() => undefined);

    const handleNewTheme = () => {
        setTheme(getRandomTheme());
    };

    if (!user && isReady) {
        return (
            <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1 }}>
                    <IdentifyForm onIdentified={setUser} />
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (!isInsideUserShell) {
        return <Navigate to="/user/ticketing" replace />;
    }

    return (
        <div style={{ position: 'relative', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
                <RequestForm user={user} theme={theme} onNewTheme={handleNewTheme} />
            </div>
        </div>
    );
}
