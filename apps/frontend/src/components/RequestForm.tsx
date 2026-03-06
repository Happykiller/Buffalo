import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_REQUEST } from '../graphql/mutations';
import { type Theme } from '../themes';

interface User {
    id: string;
    displayName: string;
}

interface RequestFormProps {
    user: User;
    theme: Theme;
    onNewTheme: () => void;
}

const criticalityOptions = [
    { value: 'LOW', label: '😌 Tranquille', color: '#4caf50' },
    { value: 'MEDIUM', label: '🤔 Moyen', color: '#ff9800' },
    { value: 'HIGH', label: '😰 Important', color: '#f44336' },
    { value: 'URGENT', label: '🔥 URGENT', color: '#b71c1c' },
];

function formatSubmissionError(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return 'Une erreur est survenue pendant la soumission.';
}

export default function RequestForm({ user, theme, onNewTheme }: RequestFormProps) {
    const [message, setMessage] = useState('');
    const [criticality, setCriticality] = useState('MEDIUM');
    const [confirmation, setConfirmation] = useState<string | null>(null);
    const [createdRequestNumber, setCreatedRequestNumber] = useState<number | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [createRequest, { loading }] = useMutation(CREATE_REQUEST);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        try {
            const trimmedMessage = message.trim();
            const result = await createRequest({
                variables: {
                    input: {
                        userDisplayName: user.displayName,
                        message: trimmedMessage ? trimmedMessage : null,
                        criticality,
                        themeKey: theme.key,
                    },
                },
            });

            const requestNumber = result.data?.createRequest?.requestNumber ?? null;
            setCreatedRequestNumber(requestNumber);
            setMessage('');
            setCriticality('MEDIUM');
            setConfirmation(theme.confirmMessage);
        } catch (error) {
            setSubmitError(formatSubmissionError(error));
        }
    };

    const handleNewRequest = () => {
        setConfirmation(null);
        setCreatedRequestNumber(null);
        setSubmitError(null);
        onNewTheme();
    };

    return (
        <div
            className="request-container"
            style={{
                background: theme.bgGradient,
                color: theme.textColor,
                minHeight: '100vh',
            }}
        >
            <div
                className="request-card"
                style={{
                    background: theme.cardBg,
                    border: theme.cardBorder,
                }}
            >
                <div className="request-header">
                    <span className="theme-emoji">{theme.emoji}</span>
                    <h1 className="request-title" style={{ color: theme.accentColor }}>
                        {theme.name}
                    </h1>
                    <p className="request-tagline">{theme.tagline}</p>
                    <p className="request-user-badge" style={{ borderColor: theme.accentColor }}>
                        Connecté en tant que <strong>{user.displayName}</strong>
                    </p>
                </div>

                {confirmation ? (
                    <div
                        className="confirmation-message"
                        style={{
                            background: theme.cardBg,
                            border: theme.cardBorder,
                            color: theme.textColor,
                        }}
                    >
                        <p>{confirmation}</p>
                        <p>
                            Numéro de demande: <strong>{createdRequestNumber ?? 'N/A'}</strong>
                        </p>
                        <button
                            className="new-request-btn"
                            onClick={handleNewRequest}
                            style={{
                                background: theme.buttonBg,
                                color: theme.buttonText,
                            }}
                        >
                            🎲 Nouvelle demande
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="request-form">
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading}
                            style={{
                                background: theme.buttonBg,
                                color: theme.buttonText,
                            }}
                        >
                            {loading ? '⏳ Envoi en cours...' : '📨 Envoyer ma demande'}
                        </button>

                        {submitError && <p className="submit-error">{submitError}</p>}

                        <div className="form-group">
                            <label className="form-label" style={{ color: theme.textColor }}>
                                ⚡ Criticité
                            </label>
                            <div className="criticality-options">
                                {criticalityOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        className={`criticality-btn ${criticality === opt.value ? 'active' : ''}`}
                                        onClick={() => setCriticality(opt.value)}
                                        style={{
                                            borderColor: criticality === opt.value ? opt.color : theme.inputBorder,
                                            background: criticality === opt.value ? opt.color + '22' : 'transparent',
                                            color: theme.textColor,
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ color: theme.textColor }}>
                                📝 Ta demande
                            </label>
                            <textarea
                                className="form-textarea"
                                placeholder="Décris ta demande, tes rêves, tes espoirs techniques…"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                style={{
                                    background: theme.inputBg,
                                    borderColor: theme.inputBorder,
                                    color: theme.textColor,
                                }}
                            />
                        </div>
                    </form>
                )}

                <button
                    className="logout-btn"
                    onClick={() => {
                        localStorage.removeItem('buffalo_user');
                        window.location.reload();
                    }}
                >
                    🚪 Changer d'identité
                </button>
            </div>
        </div>
    );
}
