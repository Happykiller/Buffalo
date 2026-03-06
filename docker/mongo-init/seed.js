// MongoDB seed script
// Executed on first init of the mongo container

db = db.getSiblingDB('buffalo');

// Seed a few sample requests

db.requests.insertMany([
    {
        userId: null,
        userDisplayName: 'Alice',
        requestNumber: 1,
        message: 'Le serveur de staging perd la mémoire toutes les 3 heures. Il faudrait lui offrir un upgrade ou un thérapeute.',
        criticality: 'HIGH',
        status: 'OPEN',
        themeKey: 'rose-absurde',
        createdAt: new Date(Date.now() - 86400000),
        processedAt: null,
    },
    {
        userId: null,
        userDisplayName: 'Bob',
        requestNumber: 2,
        message: 'Peut-on ajouter un dark mode sur le dashboard ? Mes yeux souffrent.',
        criticality: 'LOW',
        status: 'OPEN',
        themeKey: 'noir-demoniaque',
        createdAt: new Date(Date.now() - 3600000),
        processedAt: null,
    },
    {
        userId: null,
        userDisplayName: 'Faro',
        requestNumber: 3,
        message: 'Mettre à jour les dépendances npm. Certaines ont 2 ans de retard.',
        criticality: 'MEDIUM',
        status: 'DONE',
        themeKey: 'gris-corporate',
        createdAt: new Date(Date.now() - 172800000),
        processedAt: new Date(Date.now() - 86400000),
    },
]);

db['request-counters'].updateOne(
    { name: 'requestNumber' },
    { $set: { name: 'requestNumber', seq: 3 } },
    { upsert: true },
);

print('✅ Seed: 3 sample requests created');

