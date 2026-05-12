import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_NAME, USER_STORAGE_KEY } from '../config';
import type { User } from '../types/user';

interface IdentifyFormProps {
    onIdentified: (user: User) => void;
}

export default function IdentifyForm({ onIdentified }: IdentifyFormProps) {
    const [name, setName] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (displayName: string) => {
        const trimmed = displayName.trim();
        if (!trimmed) return;

        const user = { id: `local_${Date.now()}`, displayName: trimmed };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        onIdentified(user);
        navigate('/user/ticketing', { replace: true });
    };

    return (
        <div className="identify-container">
            <div className="identify-card">
                <p className="identify-app-name">{APP_NAME}</p>
                <div className="identify-emoji">🐃</div>
                <h1 className="identify-title">Qui es-tu ?</h1>
                <p className="identify-subtitle">
                    Identifie-toi pour soumettre tes demandes au Bureau des Miracles Techniques
                </p>

                <form
                    className="identify-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(name);
                    }}
                >
                    <input
                        type="text"
                        className="identify-input"
                        placeholder="Ton nom, pseudonyme, alias secret..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="identify-button"
                        disabled={!name.trim()}
                    >
                        🚀 Entrer dans le Bureau
                    </button>
                </form>
            </div>
        </div>
    );
}
