import { useMutation } from '@apollo/client';
import { MARK_REQUEST_AS_DONE } from '../graphql/mutations';
import { GET_REQUESTS } from '../graphql/queries';

interface RequestItem {
    id: string;
    requestNumber?: number | null;
    userDisplayName: string;
    message: string | null;
    url: string | null;
    criticality: string;
    status: string;
    themeKey: string;
    createdAt: string;
    processedAt: string | null;
}

interface RequestListProps {
    requests: RequestItem[];
    queryVariables: Record<string, string | number | undefined>;
}

const criticalityConfig: Record<string, { label: string; color: string }> = {
    LOW: { label: '😌 Tranquille', color: '#4caf50' },
    MEDIUM: { label: '🤔 Moyen', color: '#ff9800' },
    HIGH: { label: '😰 Important', color: '#f44336' },
    URGENT: { label: '🔥 URGENT', color: '#b71c1c' },
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function RequestList({ requests, queryVariables }: RequestListProps) {
    const [markAsDone, { loading }] = useMutation(MARK_REQUEST_AS_DONE, {
        refetchQueries: [{ query: GET_REQUESTS, variables: queryVariables }],
    });

    if (requests.length === 0) {
        return (
            <div className="empty-state">
                <span className="empty-emoji">🎉</span>
                <p>Aucune demande pour le moment. Profite du calme.</p>
            </div>
        );
    }

    return (
        <div className="request-list">
            {requests.map((req) => {
                const crit = criticalityConfig[req.criticality] || criticalityConfig.MEDIUM;
                const isDone = req.status === 'DONE';
                const requestNumberLabel = req.requestNumber ? ` • #${req.requestNumber}` : '';

                return (
                    <div key={req.id} className={`request-item ${isDone ? 'done' : ''}`}>
                        <div className="request-item-header">
                            <span className="request-author">👤 {req.userDisplayName}{requestNumberLabel}</span>
                        </div>

                        <div className="request-item-main">
                            <div className="request-item-content">
                                <p className="request-message">{req.message || '(Sans description)'}</p>
                                {req.url && (
                                    <a
                                        className="request-link"
                                        href={req.url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        🔗 {req.url}
                                    </a>
                                )}

                                <div className="request-item-footer">
                                    <span className="request-date">📅 {formatDate(req.createdAt)}</span>
                                    <span className={`request-status ${isDone ? 'status-done' : 'status-open'}`}>
                                        {isDone ? '✅ Traité' : '🔵 Ouvert'}
                                    </span>
                                    {req.processedAt && (
                                        <span className="request-processed">
                                            Traité le {formatDate(req.processedAt)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="request-item-side">
                                <span
                                    className="request-criticality"
                                    style={{ background: `${crit.color}22`, color: crit.color, borderColor: crit.color }}
                                >
                                    {crit.label}
                                </span>

                                {!isDone && (
                                    <button
                                        className="mark-done-btn"
                                        onClick={() => markAsDone({ variables: { requestId: req.id } })}
                                        disabled={loading}
                                    >
                                        ✅ Marquer comme traité
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
