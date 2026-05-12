import { useQuery } from '@apollo/client';
import { NavLink } from 'react-router-dom';
import pkg from '../../package.json';
import { APP_NAME } from '../config';
import UserRequestsBadge from './UserRequestsBadge';
import { GET_BACKEND_VERSION } from '../graphql/queries';
import type { User } from '../types/user';

interface MainNavProps {
    user: User;
    onLogout: () => void;
}

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export default function MainNav({ user, onLogout }: MainNavProps) {
    const { data: versionData } = useQuery(GET_BACKEND_VERSION);

    return (
        <header className="main-nav">
            <div className="main-nav__brand">
                <span className="main-nav__logo">🐃</span>
                <span className="main-nav__name">{APP_NAME}</span>
                <div className="main-nav__brand-tooltip">
                    {versionData?.backendVersion && <span>moteur v{versionData.backendVersion}</span>}
                    <span>web v{pkg.version}</span>
                </div>
            </div>

            <nav className="main-nav__links" aria-label="Navigation principale">
                <NavLink
                    to="/user/ticketing"
                    className={({ isActive }) =>
                        `main-nav__link${isActive ? ' main-nav__link--active' : ''}`
                    }
                >
                    Ticketing
                </NavLink>
                <NavLink
                    to="/user/daily"
                    className={({ isActive }) =>
                        `main-nav__link${isActive ? ' main-nav__link--active' : ''}`
                    }
                >
                    Daily Board
                </NavLink>
            </nav>

            <div className="main-nav__user">
                <div className="main-nav__avatar" aria-hidden="true">
                    {getInitials(user.displayName)}
                </div>
                <div className="main-nav__identity">
                    <span className="main-nav__user-label">Connecté</span>
                    <span className="main-nav__user-name">{user.displayName}</span>
                </div>
                <div className="main-nav__actions">
                    <UserRequestsBadge user={user} compact />
                    <button type="button" className="main-nav__logout" onClick={onLogout} aria-label="Déconnexion" title="Déconnexion">
                        ↪
                    </button>
                </div>
            </div>
        </header>
    );
}
