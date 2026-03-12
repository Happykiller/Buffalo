import { useQuery, useSubscription } from '@apollo/client';
import { GET_USER_REQUESTS } from '../graphql/queries';
import { USER_REQUEST_CREATED_SUBSCRIPTION, USER_REQUEST_UPDATED_SUBSCRIPTION } from '../graphql/subscriptions';

interface User {
    id: string;
    displayName: string;
}

interface UserRequestsBadgeProps {
    user: User;
}

function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function truncateMsg(msg: string | null): string {
    if (!msg) return '';
    const flat = msg.replace(/\n/g, ' ').trim();
    return flat.length > 10 ? flat.substring(0, 10) + '...' : flat;
}

function getCriticalityEmoji(crit: string): string {
    switch (crit) {
        case 'LOW': return '😌';
        case 'MEDIUM': return '🤔';
        case 'HIGH': return '😰';
        case 'URGENT': return '🔥';
        default: return '';
    }
}

export default function UserRequestsBadge({ user }: UserRequestsBadgeProps) {
    // Open Requests Query
    const { data: openData, refetch: refetchOpen } = useQuery(GET_USER_REQUESTS, {
        variables: { userDisplayName: user.displayName, status: 'OPEN' },
        fetchPolicy: 'cache-and-network',
    });

    // Treated Requests Query (limit 5)
    // We pass status: 'DONE'
    const { data: doneData, refetch: refetchDone } = useQuery(GET_USER_REQUESTS, {
        variables: { userDisplayName: user.displayName, status: 'DONE', limit: 5 },
        fetchPolicy: 'cache-and-network',
    });

    useSubscription(USER_REQUEST_CREATED_SUBSCRIPTION, {
        variables: { userDisplayName: user.displayName },
        onData: () => {
            refetchOpen();
        }
    });

    useSubscription(USER_REQUEST_UPDATED_SUBSCRIPTION, {
        variables: { userDisplayName: user.displayName },
        onData: () => {
            refetchOpen();
            refetchDone();
        }
    });

    const openCount = openData?.userRequests?.total ?? 0;
    const openItems = openData?.userRequests?.items ?? [];
    const doneItems = doneData?.userRequests?.items ?? [];

    if (openCount === 0 && doneItems.length === 0) {
        return null;
    }

    return (
        <div className="user-requests-badge">
            <div className="badge-icon">
                📊
                <span className="badge-count">{openCount}</span>
            </div>
            
            <div className="user-requests-tooltip">
                <div className="tooltip-section">
                    <strong>🔵 En cours ({openCount})</strong>
                    {openItems.length > 0 ? (
                        <ul className="tooltip-list">
                            {openItems.map((r: any) => (
                                <li key={r.id}>
                                    <span className="tooltip-req-num">#{r.requestNumber}</span>{' '}
                                    {getCriticalityEmoji(r.criticality)}{' '}
                                    <span className="tooltip-req-desc">"{truncateMsg(r.message)}"</span>{' '}
                                    <small>({formatDate(r.createdAt)})</small>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="tooltip-empty">Aucune demande en cours</p>
                    )}
                </div>

                {doneItems.length > 0 && (
                    <div className="tooltip-section tooltip-done-section">
                        <strong>✅ Récemment traitées</strong>
                        <ul className="tooltip-list">
                            {doneItems.map((r: any) => (
                                <li key={r.id} className="tooltip-done-item">
                                    <span className="tooltip-req-num">#{r.requestNumber}</span>{' '}
                                    {getCriticalityEmoji(r.criticality)}{' '}
                                    <span className="tooltip-req-desc">"{truncateMsg(r.message)}"</span>{' '}
                                    <small>(Traité le {formatDate(r.processedAt)})</small>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
