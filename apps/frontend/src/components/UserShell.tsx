import { useState, type CSSProperties } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import MainNav from './MainNav';
import { clearStoredUser, useStoredUser } from '../hooks/useStoredUser';
import { getRandomTheme } from '../themes';

export default function UserShell() {
    const { user, setUser, isReady } = useStoredUser();
    const location = useLocation();
    const [theme, setTheme] = useState(getRandomTheme);

    if (!isReady) {
        return null;
    }

    if (!user) {
        return <Navigate to="/user" replace state={{ from: location }} />;
    }

    return (
        <div
            className="app-shell"
            style={{
                '--shell-bg': theme.bgGradient,
                '--shell-text': theme.textColor,
                '--shell-surface': theme.cardBg,
                '--shell-border': theme.inputBorder,
                '--shell-accent': theme.accentColor,
                '--shell-button-bg': theme.buttonBg,
                '--shell-button-text': theme.buttonText,
                '--shell-input-bg': theme.inputBg,
            } as CSSProperties}
        >
            <MainNav
                user={user}
                onLogout={() => {
                    clearStoredUser();
                    setUser(null);
                }}
            />
            <main className="app-shell__content">
                <Outlet context={{ user, theme, setTheme }} />
            </main>
        </div>
    );
}
