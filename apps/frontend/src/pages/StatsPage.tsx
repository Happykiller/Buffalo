import { useQuery } from '@apollo/client';
import { GET_STATS } from '../graphql/queries';

interface RequesterStat {
    userDisplayName: string;
    totalCount: number;
    openCount: number;
    doneCount: number;
    urgentCount: number;
}

interface Stats {
    totalRequests: number;
    openRequests: number;
    doneRequests: number;
    byLow: number;
    byMedium: number;
    byHigh: number;
    byUrgent: number;
    avgProcessingTimeMs: number | null;
    topRequesters: RequesterStat[];
    totalRequesters: number;
}

const PODIUM_MEDALS = ['🥇', '🥈', '🥉'];

function getBadge(r: RequesterStat, rank: number): { label: string; color: string } {
    if (rank === 0) return { label: 'Champion Absurde', color: '#ffd700' };
    if (r.urgentCount >= 3) return { label: 'Ingénieur du Chaos', color: '#ff4444' };
    if (r.doneCount === r.totalCount && r.totalCount > 0)
        return { label: 'Chanceux Certifié', color: '#00e676' };
    if (r.openCount === r.totalCount && r.totalCount > 2)
        return { label: 'Éternel Espérant', color: '#82b1ff' };
    if (r.totalCount >= 5) return { label: 'Sérialiste Compulsif', color: '#e040fb' };
    if (r.urgentCount >= 1) return { label: 'Maître de la Panique', color: '#ff6d00' };
    return { label: 'Requêteur Ordinaire', color: 'var(--shell-accent)' };
}

function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}j ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}min`;
    return `${minutes}min`;
}

const criticalities = [
    { key: 'byLow', label: 'LOW', emoji: '😴', color: '#4caf50' },
    { key: 'byMedium', label: 'MEDIUM', emoji: '🤔', color: '#ff9800' },
    { key: 'byHigh', label: 'HIGH', emoji: '🔥', color: '#ff5722' },
    { key: 'byUrgent', label: 'URGENT', emoji: '🚨', color: '#f44336' },
];

export default function StatsPage() {
    const { data, loading, error } = useQuery<{ stats: Stats }>(GET_STATS, {
        pollInterval: 30000,
    });

    const stats = data?.stats;

    const pageStyle: React.CSSProperties = {
        minHeight: 'calc(100vh - 88px)',
        background: 'var(--shell-bg)',
        color: 'var(--shell-text)',
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        padding: '32px 16px 64px',
    };

    const containerStyle: React.CSSProperties = {
        maxWidth: '900px',
        margin: '0 auto',
    };

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={{ ...containerStyle, textAlign: 'center', paddingTop: '20vh' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
                    <p style={{ fontSize: '20px', color: 'color-mix(in srgb, var(--shell-text) 60%, transparent)' }}>
                        Compilation des exploits…
                    </p>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div style={pageStyle}>
                <div style={{ ...containerStyle, textAlign: 'center', paddingTop: '20vh' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>💀</div>
                    <p style={{ fontSize: '20px', color: 'color-mix(in srgb, var(--shell-text) 60%, transparent)' }}>
                        Les stats dorment. Reviens plus tard.
                    </p>
                </div>
            </div>
        );
    }

    const resolutionRate =
        stats.totalRequests > 0
            ? Math.round((stats.doneRequests / stats.totalRequests) * 100)
            : 0;

    const maxCritCount = Math.max(stats.byLow, stats.byMedium, stats.byHigh, stats.byUrgent, 1);

    const top3 = stats.topRequesters.slice(0, 3);
    const rest = stats.topRequesters.slice(3);

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div style={{ fontSize: '56px', marginBottom: '8px' }}>🏆</div>
                    <h1 style={{
                        margin: 0,
                        fontSize: 'clamp(24px, 5vw, 40px)',
                        fontWeight: 900,
                        background: 'linear-gradient(90deg, #ffd700, #ff8c00, #e040fb, #00bcd4)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '-0.5px',
                    }}>
                        Hall of Gloire Absurde
                    </h1>
                    <p style={{ margin: '8px 0 0', color: 'color-mix(in srgb, var(--shell-text) 45%, transparent)', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                        Bureau des Demandes Absurdes — Tableau de bord officieux
                    </p>
                </div>

                {/* Big stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px',
                }}>
                    <StatCard emoji="📋" label="Total" value={stats.totalRequests} color="var(--shell-accent)" />
                    <StatCard emoji="🔥" label="En attente" value={stats.openRequests} color="#ff6d00" />
                    <StatCard emoji="✅" label="Traitées" value={stats.doneRequests} color="#00e676" />
                    <StatCard emoji="👥" label="Requêteurs" value={stats.totalRequesters} color="#e040fb" />
                </div>

                {/* Resolution rate + avg time */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '32px',
                }}>
                    <div style={cardStyle}>
                        <div style={{ fontSize: '13px', color: 'color-mix(in srgb, var(--shell-text) 55%, transparent)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Taux de résolution
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flex: 1, height: '12px', borderRadius: '6px', background: 'color-mix(in srgb, var(--shell-text) 12%, transparent)', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${resolutionRate}%`,
                                    background: resolutionRate >= 80 ? '#00e676' : resolutionRate >= 50 ? '#ff9800' : '#f44336',
                                    borderRadius: '6px',
                                    transition: 'width 1s ease',
                                }} />
                            </div>
                            <span style={{ fontSize: '24px', fontWeight: 900, color: '#00e676', minWidth: '52px', textAlign: 'right' }}>
                                {resolutionRate}%
                            </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'color-mix(in srgb, var(--shell-text) 40%, transparent)', marginTop: '6px' }}>
                            {resolutionRate >= 80 ? '🌟 Bureau efficace !' : resolutionRate >= 50 ? '🤷 Ça avance doucement.' : '😬 Les demandes s\'accumulent…'}
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <div style={{ fontSize: '13px', color: 'color-mix(in srgb, var(--shell-text) 55%, transparent)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Temps de traitement moyen
                        </div>
                        {stats.avgProcessingTimeMs !== null ? (
                            <>
                                <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--shell-accent)' }}>
                                    ⏱️ {formatDuration(stats.avgProcessingTimeMs)}
                                </div>
                                <div style={{ fontSize: '12px', color: 'color-mix(in srgb, var(--shell-text) 40%, transparent)', marginTop: '6px' }}>
                                    {stats.avgProcessingTimeMs < 3600000
                                        ? '🚀 On assure !'
                                        : stats.avgProcessingTimeMs < 86400000
                                        ? '📬 Raisonnable.'
                                        : '🐢 On fait ce qu\'on peut.'}
                                </div>
                            </>
                        ) : (
                            <div style={{ fontSize: '20px', color: 'color-mix(in srgb, var(--shell-text) 40%, transparent)' }}>Aucune demande traitée</div>
                        )}
                    </div>
                </div>

                {/* Criticality breakdown */}
                <div style={{ ...cardStyle, marginBottom: '32px' }}>
                    <h2 style={sectionTitle}>⚡ Répartition par criticité</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {criticalities.map(({ key, label, emoji, color }) => {
                            const count = stats[key as keyof Stats] as number;
                            const pct = Math.round((count / maxCritCount) * 100);
                            return (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ width: '24px', textAlign: 'center', fontSize: '18px' }}>{emoji}</span>
                                    <span style={{
                                        width: '72px', fontSize: '11px', fontWeight: 700,
                                        letterSpacing: '1px', color, textTransform: 'uppercase',
                                    }}>{label}</span>
                                    <div style={{ flex: 1, height: '10px', borderRadius: '5px', background: 'color-mix(in srgb, var(--shell-text) 10%, transparent)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${pct}%`,
                                            background: `linear-gradient(90deg, ${color}, ${color}88)`,
                                            borderRadius: '5px',
                                            transition: 'width 0.8s ease',
                                        }} />
                                    </div>
                                    <span style={{ minWidth: '28px', textAlign: 'right', fontWeight: 700, color, fontSize: '16px' }}>{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Leaderboard */}
                {stats.topRequesters.length > 0 && (
                    <div style={cardStyle}>
                        <h2 style={sectionTitle}>🏅 Classement des Requêteurs</h2>

                        {top3.length > 0 && (() => {
                            const slots = [
                                { entry: top3[1], rank: 1, height: 120, bar: 'linear-gradient(180deg, #b0bec5, #78909c)' },
                                { entry: top3[0], rank: 0, height: 160, bar: 'linear-gradient(180deg, #ffd700, #ff8c00)' },
                                { entry: top3[2], rank: 2, height: 100, bar: 'linear-gradient(180deg, #cd7f32, #8d5524)' },
                            ];
                            return (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    marginBottom: '32px',
                                }}>
                                    {slots.map(({ entry, rank, height, bar }) => {
                                        if (!entry) return null;
                                        const badge = getBadge(entry, rank);
                                        return (
                                            <div key={entry.userDisplayName} style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                            }}>
                                                <div style={{
                                                    minHeight: '110px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'flex-end',
                                                    paddingBottom: '8px',
                                                    gap: '4px',
                                                }}>
                                                    <div style={{ fontSize: '28px' }}>{PODIUM_MEDALS[rank]}</div>
                                                    <div style={{
                                                        fontWeight: 700,
                                                        fontSize: '14px',
                                                        textAlign: 'center',
                                                        maxWidth: '110px',
                                                        wordBreak: 'break-word',
                                                        lineHeight: 1.2,
                                                        color: 'var(--shell-text)',
                                                    }}>
                                                        {entry.userDisplayName}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '10px',
                                                        color: badge.color,
                                                        fontWeight: 700,
                                                        textAlign: 'center',
                                                        padding: '2px 6px',
                                                        background: `${badge.color}22`,
                                                        borderRadius: '4px',
                                                        border: `1px solid ${badge.color}44`,
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {badge.label}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    width: '80px',
                                                    height: `${height}px`,
                                                    borderRadius: '6px 6px 0 0',
                                                    background: bar,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '22px',
                                                    fontWeight: 900,
                                                    color: '#fff',
                                                    boxShadow: rank === 0 ? '0 -6px 24px #ffd70055' : '0 -4px 12px rgba(0,0,0,0.15)',
                                                }}>
                                                    {entry.totalCount}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}

                        {/* Ranks 4–10 */}
                        {rest.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {rest.map((r, i) => {
                                    const rank = i + 3;
                                    const badge = getBadge(r, rank);
                                    return (
                                        <div key={r.userDisplayName} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            background: 'color-mix(in srgb, var(--shell-surface) 8%, transparent)',
                                            border: '1px solid var(--shell-border)',
                                        }}>
                                            <span style={{ width: '24px', color: 'color-mix(in srgb, var(--shell-text) 45%, transparent)', fontWeight: 700, fontSize: '14px', textAlign: 'center' }}>
                                                #{rank + 1}
                                            </span>
                                            <span style={{ flex: 1, fontWeight: 600, fontSize: '14px', color: 'var(--shell-text)' }}>{r.userDisplayName}</span>
                                            <span style={{
                                                fontSize: '10px',
                                                color: badge.color,
                                                fontWeight: 700,
                                                padding: '2px 6px',
                                                background: `${badge.color}22`,
                                                borderRadius: '4px',
                                                border: `1px solid ${badge.color}44`,
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {badge.label}
                                            </span>
                                            <span style={{ fontWeight: 700, fontSize: '16px', minWidth: '28px', textAlign: 'right', color: 'color-mix(in srgb, var(--shell-text) 75%, transparent)' }}>
                                                {r.totalCount}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '48px', color: 'color-mix(in srgb, var(--shell-text) 40%, transparent)', fontSize: '13px' }}>
                    Mis à jour toutes les 30s
                </div>
            </div>
        </div>
    );
}

const cardStyle: React.CSSProperties = {
    background: 'color-mix(in srgb, var(--shell-surface, #ffffff) 20%, transparent)',
    border: '1px solid var(--shell-border, rgba(255,255,255,0.1))',
    borderRadius: '12px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
};

const sectionTitle: React.CSSProperties = {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    color: 'var(--shell-text)',
};

function StatCard({ emoji, label, value, color }: { emoji: string; label: string; value: number; color: string }) {
    return (
        <div style={{
            ...cardStyle,
            textAlign: 'center',
            borderColor: `color-mix(in srgb, ${color} 35%, var(--shell-border, rgba(255,255,255,0.1)))`,
            boxShadow: `0 0 20px color-mix(in srgb, ${color} 12%, transparent)`,
        }}>
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>{emoji}</div>
            <div style={{ fontSize: '36px', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '12px', color: 'color-mix(in srgb, var(--shell-text) 55%, transparent)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
        </div>
    );
}
