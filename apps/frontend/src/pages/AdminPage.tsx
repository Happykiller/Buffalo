import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_REQUESTS } from '../graphql/queries';
import RequestList from '../components/RequestList';

export default function AdminPage() {
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [criticalityFilter, setCriticalityFilter] = useState<string>('');
    const [search, setSearch] = useState('');

    const variables: Record<string, string | undefined> = {};
    if (statusFilter) variables.status = statusFilter;
    if (criticalityFilter) variables.criticality = criticalityFilter;
    if (search.trim()) variables.search = search.trim();

    const { data, loading, error } = useQuery(GET_REQUESTS, {
        variables,
        pollInterval: 5000,
    });

    const openCount = data?.requests?.filter((r: { status: string }) => r.status === 'OPEN').length ?? 0;
    const doneCount = data?.requests?.filter((r: { status: string }) => r.status === 'DONE').length ?? 0;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div className="admin-title-row">
                    <h1 className="admin-title">🐃 Buffalo Admin</h1>
                    <a href="/user" className="admin-link">← Côté utilisateur</a>
                </div>
                <p className="admin-subtitle">Tableau de bord des demandes</p>

                <div className="admin-stats">
                    <div className="stat-card stat-open">
                        <span className="stat-number">{openCount}</span>
                        <span className="stat-label">Ouvertes</span>
                    </div>
                    <div className="stat-card stat-done">
                        <span className="stat-number">{doneCount}</span>
                        <span className="stat-label">Traitées</span>
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
            {data && <RequestList requests={data.requests} />}
        </div>
    );
}
