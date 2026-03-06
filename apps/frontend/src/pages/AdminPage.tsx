import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_REQUESTS } from '../graphql/queries';
import RequestList from '../components/RequestList';
import { APP_NAME } from '../config';

const PAGE_SIZE = 10;
const LOCALHOSTS = new Set(['localhost', '127.0.0.1', '::1']);

interface AdminRequestItem {
    id: string;
    requestNumber?: number | null;
    userDisplayName: string;
    status: string;
}

export default function AdminPage() {
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
    const isLocalhost = LOCALHOSTS.has(currentHost);
    const supportsNotifications = typeof window !== 'undefined' && 'Notification' in window;
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
        supportsNotifications ? Notification.permission : 'denied',
    );

    const [statusFilter, setStatusFilter] = useState<string>('');
    const [criticalityFilter, setCriticalityFilter] = useState<string>('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const isNotificationBootstrappedRef = useRef(false);
    const seenRequestIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        setPage(1);
    }, [statusFilter, criticalityFilter, search]);

    const variables: Record<string, string | number | undefined> = {
        page,
        pageSize: PAGE_SIZE,
    };
    if (statusFilter) variables.status = statusFilter;
    if (criticalityFilter) variables.criticality = criticalityFilter;
    if (search.trim()) variables.search = search.trim();

    const { data, loading, error } = useQuery(GET_REQUESTS, {
        variables,
        skip: !isLocalhost,
        pollInterval: 5000,
    });

    const notificationFeedQuery = useQuery(GET_REQUESTS, {
        variables: { page: 1, pageSize: 10 },
        skip: !isLocalhost || !supportsNotifications,
        pollInterval: 5000,
    });

    useEffect(() => {
        if (!supportsNotifications) return;
        setNotificationPermission(Notification.permission);
    }, [supportsNotifications]);

    useEffect(() => {
        if (!supportsNotifications || notificationPermission !== 'granted') {
            return;
        }

        const feedItems = (notificationFeedQuery.data?.requests?.items ?? []) as AdminRequestItem[];
        if (feedItems.length === 0) {
            return;
        }

        if (!isNotificationBootstrappedRef.current) {
            feedItems.forEach((item) => seenRequestIdsRef.current.add(item.id));
            isNotificationBootstrappedRef.current = true;
            return;
        }

        const newItems = feedItems.filter((item) => !seenRequestIdsRef.current.has(item.id));
        if (newItems.length === 0) {
            return;
        }

        newItems
            .slice()
            .reverse()
            .forEach((item) => {
                const number = item.requestNumber ? `#${item.requestNumber}` : item.id;
                const body = `Nouvelle demande ${number} par ${item.userDisplayName}`;
                new Notification(`${APP_NAME} Admin`, { body });
            });

        newItems.forEach((item) => seenRequestIdsRef.current.add(item.id));
    }, [APP_NAME, notificationFeedQuery.data, notificationPermission, supportsNotifications]);

    const enableNotifications = async () => {
        if (!supportsNotifications) return;
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
    };

    if (!isLocalhost) {
        return (
            <div className="admin-container">
                <p className="admin-error">❌ Accès admin autorisé uniquement depuis localhost.</p>
            </div>
        );
    }

    const requests = data?.requests?.items ?? [];
    const currentPage = data?.requests?.page ?? page;
    const totalPages = data?.requests?.totalPages ?? 1;
    const total = data?.requests?.total ?? 0;

    const openCount = requests.filter((r: { status: string }) => r.status === 'OPEN').length;
    const doneCount = requests.filter((r: { status: string }) => r.status === 'DONE').length;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div className="admin-title-row">
                    <h1 className="admin-title">🐃 {APP_NAME} Admin</h1>
                    <a href="/user" className="admin-link">← Côté utilisateur</a>
                </div>
                <p className="admin-subtitle">Tableau de bord des demandes</p>

                <div className="admin-notification-row">
                    {!supportsNotifications && (
                        <span className="admin-notification-text">Notifications navigateur non supportées.</span>
                    )}
                    {supportsNotifications && notificationPermission === 'granted' && (
                        <span className="admin-notification-text admin-notification-ok">
                            Notifications activées.
                        </span>
                    )}
                    {supportsNotifications && notificationPermission === 'denied' && (
                        <span className="admin-notification-text admin-notification-warn">
                            Notifications bloquées par le navigateur.
                        </span>
                    )}
                    {supportsNotifications && notificationPermission === 'default' && (
                        <button className="admin-notification-btn" onClick={enableNotifications}>
                            Activer les notifications
                        </button>
                    )}
                </div>

                <div className="admin-stats">
                    <div className="stat-card stat-open">
                        <span className="stat-number">{openCount}</span>
                        <span className="stat-label">Ouvertes (page)</span>
                    </div>
                    <div className="stat-card stat-done">
                        <span className="stat-number">{doneCount}</span>
                        <span className="stat-label">Traitées (page)</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-number">{total}</span>
                        <span className="stat-label">Total filtré</span>
                    </div>
                </div>
            </div>

            <div className="admin-filters">
                <input
                    type="text"
                    className="admin-search"
                    placeholder="🔍 Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="admin-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">Tous les statuts</option>
                    <option value="OPEN">🔵 Ouvert</option>
                    <option value="DONE">✅ Traité</option>
                </select>
                <select
                    className="admin-select"
                    value={criticalityFilter}
                    onChange={(e) => setCriticalityFilter(e.target.value)}
                >
                    <option value="">Toutes les criticités</option>
                    <option value="LOW">😌 Tranquille</option>
                    <option value="MEDIUM">🤔 Moyen</option>
                    <option value="HIGH">😰 Important</option>
                    <option value="URGENT">🔥 URGENT</option>
                </select>
            </div>

            {loading && <p className="admin-loading">⏳ Chargement...</p>}
            {error && <p className="admin-error">❌ Erreur : {error.message}</p>}
            {data && (
                <>
                    <RequestList requests={requests} queryVariables={variables} />
                    <div className="admin-pagination">
                        <button
                            className="admin-page-btn"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage <= 1}
                        >
                            Précédent
                        </button>
                        <span className="admin-page-info">
                            Page {currentPage} / {totalPages}
                        </span>
                        <button
                            className="admin-page-btn"
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage >= totalPages}
                        >
                            Suivant
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
