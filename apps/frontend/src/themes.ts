export interface Theme {
    key: string;
    name: string;
    emoji: string;
    tagline: string;
    confirmMessage: string;
    bgGradient: string;
    cardBg: string;
    cardBorder: string;
    textColor: string;
    accentColor: string;
    buttonBg: string;
    buttonText: string;
    inputBg: string;
    inputBorder: string;
}

export const themes: Theme[] = [
    {
        key: 'rose-absurde',
        name: 'Akama',
        emoji: '🦩',
        tagline: 'Dis-moi ton souhait, je le réaliserai peut-être.',
        confirmMessage: '✨ Ta demande flotte désormais dans l\'éther rose des possibles. Un flamant rose l\'examinera sous peu.',
        bgGradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fdfcfb 100%)',
        cardBg: 'rgba(255, 255, 255, 0.85)',
        cardBorder: '2px solid #f8a4c8',
        textColor: '#4a1942',
        accentColor: '#e91e8c',
        buttonBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        buttonText: '#ffffff',
        inputBg: 'rgba(255, 255, 255, 0.9)',
        inputBorder: '#f8a4c8',
    },
    {
        key: 'noir-demoniaque',
        name: 'Pandémonium',
        emoji: '😈',
        tagline: 'Es-tu prêt à conclure un pacte pour cette demande ?',
        confirmMessage: '🔥 Le pacte est scellé. Ton âme... euh, ta demande a été enregistrée. Nul retour en arrière.',
        bgGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        cardBg: 'rgba(30, 20, 50, 0.9)',
        cardBorder: '2px solid #8b0000',
        textColor: '#e0d0ff',
        accentColor: '#ff4444',
        buttonBg: 'linear-gradient(135deg, #8b0000 0%, #dc143c 100%)',
        buttonText: '#ffffff',
        inputBg: 'rgba(20, 10, 40, 0.8)',
        inputBorder: '#5a2d5a',
    },
    {
        key: 'gris-corporate',
        name: 'Boring company',
        emoji: '📊',
        tagline: 'Tu as vraiment essayé de réfléchir avant de cliquer ici ?',
        confirmMessage: '📋 Votre ticket n°' + Math.floor(Math.random() * 99999) + ' a été créé. Temps d\'attente estimé : entre 2h et 6 mois.',
        bgGradient: 'linear-gradient(135deg, #e8e8e8 0%, #c9c9c9 50%, #f5f5f5 100%)',
        cardBg: 'rgba(255, 255, 255, 0.95)',
        cardBorder: '1px solid #cccccc',
        textColor: '#333333',
        accentColor: '#666666',
        buttonBg: 'linear-gradient(135deg, #555555 0%, #888888 100%)',
        buttonText: '#ffffff',
        inputBg: '#ffffff',
        inputBorder: '#cccccc',
    },
    {
        key: 'contrat-mystique',
        name: 'Irma',
        emoji: '🔮',
        tagline: 'Le bureau des miracles techniques t\'écoute.',
        confirmMessage: '🌟 Les astres ont enregistré ta requête. La constellation du Debugger veillera sur elle.',
        bgGradient: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 30%, #11998e 100%)',
        cardBg: 'rgba(25, 15, 55, 0.85)',
        cardBorder: '2px solid #c9a84c',
        textColor: '#f0e6d2',
        accentColor: '#c9a84c',
        buttonBg: 'linear-gradient(135deg, #c9a84c 0%, #8b6914 100%)',
        buttonText: '#1a0533',
        inputBg: 'rgba(15, 10, 40, 0.7)',
        inputBorder: '#c9a84c',
    },
    {
        key: 'support-premium',
        name: 'SOS Premium',
        emoji: '👑',
        tagline: 'Chaque demande a un prix. Heureusement ici c\'est gratuit.',
        confirmMessage: '💎 Votre demande PREMIUM™ a été prise en charge par notre équipe de 0 personne. Merci pour votre patience infinie.',
        bgGradient: 'linear-gradient(135deg, #0c1445 0%, #1a237e 50%, #283593 100%)',
        cardBg: 'rgba(10, 20, 60, 0.9)',
        cardBorder: '2px solid #ffd700',
        textColor: '#e8e0ff',
        accentColor: '#ffd700',
        buttonBg: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
        buttonText: '#0c1445',
        inputBg: 'rgba(10, 15, 50, 0.8)',
        inputBorder: '#3a50a0',
    },
];

export function getRandomTheme(): Theme {
    return themes[Math.floor(Math.random() * themes.length)];
}
