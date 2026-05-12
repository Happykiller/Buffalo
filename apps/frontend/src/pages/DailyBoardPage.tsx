import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { useOutletContext } from 'react-router-dom';
import { GET_DAILY_BOARD } from '../graphql/queries';
import {
    CREATE_DAILY_NOTE,
    DELETE_DAILY_NOTE,
    HEARTBEAT_DAILY_PRESENCE,
    RESTORE_DAILY_NOTE,
    UPDATE_DAILY_FOCUS,
    UPDATE_DAILY_NOTE,
} from '../graphql/mutations';
import {
    DAILY_BOARD_UPDATED_SUBSCRIPTION,
    DAILY_PRESENCE_CHANGED_SUBSCRIPTION,
} from '../graphql/subscriptions';
import type { UserShellContext } from '../types/user-shell-context';

type NoteColumn = 'TODO' | 'DOING' | 'BLOCKED' | 'DONE';
type CreateColumn = NoteColumn | 'DONE_YESTERDAY';
type PersonStatus = 'ONLINE' | 'ABSENT' | 'EDITING';

interface DailyNote {
    id: string;
    boardId: string;
    ownerPseudo: string;
    authorPseudo: string;
    column: NoteColumn;
    title: string;
    description: string | null;
    label: string | null;
    url: string | null;
    done: boolean;
    blockedSince: string | null;
    doneAt: string | null;
    helpNeeded: string | null;
    unblockAssignedTo: string | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

interface DailyPerson {
    pseudo: string;
    status: PersonStatus;
    doneYesterday: DailyNote[];
    todo: DailyNote[];
    doing: DailyNote[];
    blocked: DailyNote[];
    done: DailyNote[];
}

interface DailyBoardData {
    dailyBoard: {
        board: {
            id: string;
            date: string;
            focus: string;
            createdAt: string;
            updatedAt: string;
        };
        blockers: DailyNote[];
        people: DailyPerson[];
        labels: string[];
        connectedCount: number;
        savedAt: string;
    };
}

interface CreateModalState {
    pseudo: string;
    column: CreateColumn;
}

interface ToastState {
    noteId: string;
    label: string;
}

interface DragState {
    note: DailyNote;
    ownerPseudo: string;
    column: NoteColumn;
}

const BOARD_DATE = formatBoardDate(new Date());
const WORKFLOW_COLUMNS: Array<{ key: NoteColumn; title: string }> = [
    { key: 'TODO', title: 'À faire' },
    { key: 'DOING', title: 'En cours' },
    { key: 'BLOCKED', title: 'Bloqué' },
    { key: 'DONE', title: 'Done' },
];
const LABEL_SWATCHES = ['Dev', 'Support', 'Déploiement', 'Décision'];

export default function DailyBoardPage() {
    const { user } = useOutletContext<UserShellContext>();
    const [historyOpen, setHistoryOpen] = useState(false);
    const [focusDraft, setFocusDraft] = useState('');
    const [createModal, setCreateModal] = useState<CreateModalState | null>(null);
    const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
    const [editingTitleValue, setEditingTitleValue] = useState('');
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastState | null>(null);
    const [draggedNote, setDraggedNote] = useState<DragState | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);

    const { data, loading, error, refetch } = useQuery<DailyBoardData>(GET_DAILY_BOARD, {
        variables: { date: BOARD_DATE, currentPseudo: user.displayName },
        fetchPolicy: 'cache-and-network',
    });

    const [createNote] = useMutation(CREATE_DAILY_NOTE);
    const [updateNote] = useMutation(UPDATE_DAILY_NOTE);
    const [deleteNote] = useMutation(DELETE_DAILY_NOTE);
    const [restoreNote] = useMutation(RESTORE_DAILY_NOTE);
    const [updateFocus] = useMutation(UPDATE_DAILY_FOCUS);
    const [heartbeatPresence] = useMutation(HEARTBEAT_DAILY_PRESENCE);

    useSubscription(DAILY_BOARD_UPDATED_SUBSCRIPTION, {
        variables: { boardDate: BOARD_DATE },
        onData: async () => {
            await refetch();
        },
    });
    useSubscription(DAILY_PRESENCE_CHANGED_SUBSCRIPTION, {
        variables: { boardDate: BOARD_DATE },
        onData: async () => {
            await refetch();
        },
    });

    useEffect(() => {
        setFocusDraft(data?.dailyBoard.board.focus ?? '');
    }, [data?.dailyBoard.board.focus]);

    useEffect(() => {
        const sendHeartbeat = () => {
            void heartbeatPresence({
                variables: { input: { boardDate: BOARD_DATE, pseudo: user.displayName, editingSectionId } },
            });
        };
        sendHeartbeat();
        const interval = window.setInterval(sendHeartbeat, 30000);
        return () => window.clearInterval(interval);
    }, [heartbeatPresence, user.displayName, editingSectionId]);

    useEffect(() => {
        if (!toast) return;
        const timeout = window.setTimeout(() => setToast(null), 5000);
        return () => window.clearTimeout(timeout);
    }, [toast]);

    const board = data?.dailyBoard;
    const relativeSavedAt = useMemo(() => formatRelativeTime(board?.savedAt), [board?.savedAt]);

    if (loading && !board) return <div className="daily-board-page"><div className="daily-board-loading">Chargement du Daily Board…</div></div>;
    if (error) return <div className="daily-board-page"><div className="daily-board-error">Erreur de chargement: {error.message}</div></div>;
    if (!board) return null;

    async function handleCreateNote(values: { title: string; label?: string; ownerPseudo: string; url?: string; description?: string }) {
        if (!createModal) return;
        await createNote({
            variables: {
                input: {
                    boardDate: BOARD_DATE,
                    ownerPseudo: values.ownerPseudo,
                    authorPseudo: user.displayName,
                    column: createModal.column === 'DONE_YESTERDAY' ? 'DONE' : createModal.column,
                    title: values.title,
                    createdAt: createModal.column === 'DONE_YESTERDAY' ? toYesterdayIso() : null,
                    label: values.label || null,
                    url: values.url || null,
                    description: values.description || null,
                    doneAt: createModal.column === 'DONE_YESTERDAY' ? toYesterdayIso() : null,
                    helpNeeded: createModal.column === 'BLOCKED' ? values.description || null : null,
                },
            },
        });
        setCreateModal(null);
        await refetch();
    }

    async function handleFocusSave() {
        await updateFocus({ variables: { input: { boardDate: BOARD_DATE, focus: focusDraft } } });
        setEditingSectionId(null);
        await refetch();
    }

    async function handleInlineTitleSave(noteId: string) {
        const title = editingTitleValue.trim();
        if (!title) {
            setEditingTitleId(null);
            return;
        }
        await updateNote({ variables: { noteId, input: { title } } });
        setEditingTitleId(null);
        setEditingSectionId(null);
        await refetch();
    }

    async function handleDelete(note: DailyNote) {
        await deleteNote({ variables: { noteId: note.id } });
        setToast({ noteId: note.id, label: note.title });
        await refetch();
    }

    async function handleRestore(noteId: string) {
        await restoreNote({ variables: { noteId } });
        setToast(null);
        await refetch();
    }

    async function handleDropOnColumn(ownerPseudo: string, column: NoteColumn) {
        if (!draggedNote) return;
        if (draggedNote.ownerPseudo === ownerPseudo && draggedNote.column === column) {
            setDraggedNote(null);
            setDropTarget(null);
            return;
        }
        await updateNote({
            variables: {
                noteId: draggedNote.note.id,
                input: {
                    ownerPseudo,
                    column,
                    helpNeeded: column === 'BLOCKED' ? draggedNote.note.helpNeeded : null,
                    unblockAssignedTo: column === 'BLOCKED' ? draggedNote.note.unblockAssignedTo : null,
                },
            },
        });
        setDraggedNote(null);
        setDropTarget(null);
        await refetch();
    }

    return (
        <div className="daily-board-page">
            <section className="daily-board-header">
                <div>
                    <h1>{formatHeaderDate(board.board.date)}</h1>
                </div>
                <div className="daily-board-header__meta">
                    <span className="presence-pill">● {board.connectedCount} personnes connectées</span>
                    <div className="presence-stack">
                        {board.people.slice(0, 6).map((person) => (
                            <span key={person.pseudo} className="presence-avatar" title={person.pseudo}>{getInitials(person.pseudo)}</span>
                        ))}
                    </div>
                    <span className="saved-pill">Sauvegardé · {relativeSavedAt}</span>
                    <button type="button" className="ghost-button" onClick={() => setHistoryOpen(true)}>Historique</button>
                </div>
            </section>

            <section className="focus-bar">
                <label htmlFor="daily-focus">Focus du jour</label>
                <input
                    id="daily-focus"
                    value={focusDraft}
                    onChange={(event) => setFocusDraft(event.target.value)}
                    onFocus={() => setEditingSectionId('focus')}
                    onBlur={() => void handleFocusSave()}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            void handleFocusSave();
                        }
                        if (event.key === 'Escape') {
                            setFocusDraft(board.board.focus);
                            setEditingSectionId(null);
                        }
                    }}
                    placeholder="Quel est le focus principal de l'équipe aujourd'hui ?"
                />
            </section>

            <section className="blockers-panel">
                <div className="blockers-panel__header">
                    <div>
                        <h2>Blocages actifs</h2>
                        <p>Les points rouges restent visibles en haut pendant le daily.</p>
                    </div>
                </div>
                <div className="blockers-list">
                    {board.blockers.length === 0 && <div className="empty-inline">Aucun blocage actif.</div>}
                    {board.blockers.map((note) => (
                        <div key={note.id} className="blocker-row">
                            <div>
                                <strong>{note.title}</strong>
                                <div className="blocker-meta">
                                    <span>{note.blockedSince ? `depuis ${formatRelativeTime(note.blockedSince)}` : 'bloqué maintenant'}</span>
                                    {note.helpNeeded && <span>{note.helpNeeded}</span>}
                                    {note.url && <a href={note.url} target="_blank" rel="noreferrer">Lien</a>}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="danger-ghost-button"
                                onClick={() => void handleDropOnColumn(note.ownerPseudo, 'DOING')}
                                disabled={note.ownerPseudo !== user.displayName}
                            >
                                Déplacer en cours
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="people-board">
                {board.people.map((person) => (
                    <article key={person.pseudo} className="person-row">
                        <div className="person-row__header">
                            <div className="person-row__identity">
                                <span className="person-avatar">{getInitials(person.pseudo)}</span>
                                <div>
                                    <strong>{person.pseudo}</strong>
                                    <span className={`person-status person-status--${person.status.toLowerCase()}`}>
                                        {person.status === 'EDITING' ? '✎ édite…' : person.status === 'ONLINE' ? 'en ligne' : 'absent'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {(() => {
                            const isCurrentUserRow = person.pseudo === user.displayName;
                            return (
                        <div className="person-row__grid person-row__grid--five">
                            <section className="person-column person-column--history">
                                <header className="person-column__header"><h3>Fait hier</h3></header>
                                <div className="person-column__notes">
                                    {person.doneYesterday.map((note) => (
                                        <NoteCard
                                            key={note.id}
                                            note={note}
                                            labels={board.labels}
                                            isHistorical
                                            isEditing={editingTitleId === note.id}
                                            editingTitleValue={editingTitleValue}
                                            canEdit={isCurrentUserRow}
                                            onDragEnd={() => {
                                                setDraggedNote(null);
                                                setDropTarget(null);
                                            }}
                                            onDragStart={(note) => {
                                                setDraggedNote(note ? {
                                                    note,
                                                    ownerPseudo: person.pseudo,
                                                    column: note.column,
                                                } : null);
                                                setDropTarget(null);
                                            }}
                                            onTitleEditStart={() => {
                                                setEditingTitleId(note.id);
                                                setEditingTitleValue(note.title);
                                                setEditingSectionId(`person:${person.pseudo}`);
                                            }}
                                            onTitleEditChange={setEditingTitleValue}
                                            onTitleEditSave={() => void handleInlineTitleSave(note.id)}
                                            onTitleEditCancel={() => {
                                                setEditingTitleId(null);
                                                setEditingSectionId(null);
                                            }}
                                            onUpdate={async (input) => {
                                                await updateNote({ variables: { noteId: note.id, input } });
                                                await refetch();
                                            }}
                                            onDelete={() => void handleDelete(note)}
                                        />
                                    ))}
                                </div>
                                {isCurrentUserRow && (
                                    <button
                                        type="button"
                                        className="add-note-button"
                                        onClick={() => setCreateModal({ pseudo: person.pseudo, column: 'DONE_YESTERDAY' })}
                                    >
                                        + Ajouter une note…
                                    </button>
                                )}
                            </section>

                            {WORKFLOW_COLUMNS.map((column) => {
                                const columnNotes = person[column.key.toLowerCase() as 'todo' | 'doing' | 'blocked' | 'done'];
                                const targetKey = `${person.pseudo}:${column.key}`;
                                const isOriginColumn =
                                    draggedNote?.ownerPseudo === person.pseudo && draggedNote.column === column.key;
                                const isDroppable = Boolean(draggedNote && isCurrentUserRow && !isOriginColumn);
                                return (
                                    <section
                                        key={column.key}
                                        className={`person-column${column.key === 'BLOCKED' ? ' person-column--blocked' : ''}${isDroppable ? ' person-column--droppable' : ''}${dropTarget === targetKey ? ' person-column--drop-active' : ''}`}
                                        onDragOver={(event) => {
                                            if (isDroppable) {
                                                event.preventDefault();
                                                setDropTarget(targetKey);
                                            }
                                        }}
                                        onDragLeave={() => {
                                            if (dropTarget === targetKey) {
                                                setDropTarget(null);
                                            }
                                        }}
                                        onDrop={() => {
                                            if (isDroppable) {
                                                void handleDropOnColumn(person.pseudo, column.key);
                                            }
                                        }}
                                    >
                                        <header className="person-column__header"><h3>{column.title}</h3></header>
                                        <div className="person-column__notes">
                                            {columnNotes.map((note) => (
                                                <NoteCard
                                                    key={note.id}
                                                    note={note}
                                                    labels={board.labels}
                                                    isHistorical={false}
                                                    isEditing={editingTitleId === note.id}
                                                    editingTitleValue={editingTitleValue}
                                                    canEdit={isCurrentUserRow}
                                                    onDragEnd={() => {
                                                        setDraggedNote(null);
                                                        setDropTarget(null);
                                                    }}
                                                    onDragStart={(note) => {
                                                        setDraggedNote(note ? {
                                                            note,
                                                            ownerPseudo: person.pseudo,
                                                            column: note.column,
                                                        } : null);
                                                        setDropTarget(null);
                                                    }}
                                                    onTitleEditStart={() => {
                                                        setEditingTitleId(note.id);
                                                        setEditingTitleValue(note.title);
                                                        setEditingSectionId(`person:${person.pseudo}`);
                                                    }}
                                                    onTitleEditChange={setEditingTitleValue}
                                                    onTitleEditSave={() => void handleInlineTitleSave(note.id)}
                                                    onTitleEditCancel={() => {
                                                        setEditingTitleId(null);
                                                        setEditingSectionId(null);
                                                    }}
                                                    onUpdate={async (input) => {
                                                        await updateNote({ variables: { noteId: note.id, input } });
                                                        await refetch();
                                                    }}
                                                    onDelete={() => void handleDelete(note)}
                                                />
                                            ))}
                                        </div>
                                        {isCurrentUserRow && (
                                            <button
                                                type="button"
                                                className="add-note-button"
                                                onClick={() => setCreateModal({ pseudo: person.pseudo, column: column.key })}
                                            >
                                                + Ajouter une note…
                                            </button>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                            );
                        })()}
                    </article>
                ))}
            </section>

            {createModal && (
                <CreateNoteModal
                    labels={[...new Set([...LABEL_SWATCHES, ...board.labels].filter(Boolean))]}
                    defaultOwner={createModal.pseudo}
                    currentUser={user.displayName}
                    onClose={() => {
                        setCreateModal(null);
                        setEditingSectionId(null);
                    }}
                    onSubmit={(values) => void handleCreateNote(values)}
                />
            )}

            {historyOpen && (
                <DailySummaryOverlay
                    boardDate={board.board.date}
                    focus={board.board.focus}
                    people={board.people}
                    onClose={() => setHistoryOpen(false)}
                />
            )}

            {toast && (
                <div className="daily-toast">
                    <span>Carte supprimée · {toast.label}</span>
                    <button type="button" onClick={() => void handleRestore(toast.noteId)}>Annuler</button>
                </div>
            )}
        </div>
    );
}

function NoteCard(props: {
    note: DailyNote;
    labels: string[];
    isHistorical?: boolean;
    isEditing: boolean;
    editingTitleValue: string;
    canEdit: boolean;
    onDragStart: (note: DailyNote | null) => void;
    onDragEnd: () => void;
    onTitleEditStart: () => void;
    onTitleEditChange: (value: string) => void;
    onTitleEditSave: () => void;
    onTitleEditCancel: () => void;
    onUpdate: (input: Record<string, unknown>) => Promise<void>;
    onDelete: () => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const ageState = getNoteAgeState(props.note);

    return (
        <div
            className={`note-card${props.note.column === 'BLOCKED' ? ' note-card--blocker' : ''}${ageState ? ` note-card--${ageState}` : ''}`}
            draggable={props.canEdit && !props.isHistorical}
            onDragStart={() => {
                if (props.canEdit && !props.isHistorical) {
                    props.onDragStart(props.note);
                }
            }}
            onDragEnd={props.onDragEnd}
        >
            <div className="note-card__top">
                {!props.isHistorical && props.canEdit && (
                    <span className="note-card__drag-grip" title="Glisser-déposer" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                    </span>
                )}
                {props.isEditing ? (
                    <input
                        className="note-card__title-input"
                        value={props.editingTitleValue}
                        autoFocus
                        onChange={(event) => props.onTitleEditChange(event.target.value)}
                        onBlur={props.onTitleEditSave}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                props.onTitleEditSave();
                            }
                            if (event.key === 'Escape') {
                                props.onTitleEditCancel();
                            }
                        }}
                    />
                ) : (
                    <button type="button" className="note-card__title" onClick={props.canEdit ? props.onTitleEditStart : undefined}>{props.note.title}</button>
                )}
                {props.canEdit && (
                    <button type="button" className="note-menu-button" onClick={() => setMenuOpen((value) => !value)}>···</button>
                )}
            </div>

            <div className="note-card__meta">
                {props.note.url && <a href={props.note.url} target="_blank" rel="noreferrer">Lien</a>}
            </div>
            {props.note.description && <p className="note-card__description">{props.note.description}</p>}
            <div className="note-card__footer">
                <div className="note-card__footer-left">
                    {props.note.label && <span className="note-chip">{props.note.label}</span>}
                </div>
                <div className="note-card__info">
                    <button type="button" className="note-card__info-button" aria-label="Informations de la note">
                        i
                    </button>
                    <div className="note-card__tooltip">
                        <span>Créée {formatMiniDate(props.note.createdAt)}</span>
                        <span>Modifiée {formatMiniDate(props.note.updatedAt)}</span>
                        {props.note.doneAt && <span>Finie {formatMiniDate(props.note.doneAt)}</span>}
                    </div>
                </div>
            </div>

            {props.canEdit && menuOpen && (
                <div className="note-menu">
                    <button type="button" className="note-menu__danger" onClick={props.onDelete}>Supprimer</button>
                </div>
            )}
        </div>
    );
}

function CreateNoteModal(props: {
    labels: string[];
    defaultOwner: string;
    currentUser: string;
    onClose: () => void;
    onSubmit: (values: { title: string; label?: string; ownerPseudo: string; url?: string; description?: string }) => void;
}) {
    const [title, setTitle] = useState('');
    const [label, setLabel] = useState('');
    const ownerPseudo = props.defaultOwner || props.currentUser;
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');

    return (
        <div className="modal-backdrop" onClick={props.onClose}>
            <div className="create-note-modal" onClick={(event) => event.stopPropagation()}>
                <h2>Ajouter une note</h2>
                <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre" />
                <div className="label-picker">
                    {props.labels.filter(Boolean).map((item) => (
                        <button key={item} type="button" className={`label-chip${label === item ? ' label-chip--active' : ''}`} onClick={() => setLabel(item)}>{item}</button>
                    ))}
                    <button
                        type="button"
                        className="label-chip"
                        onClick={() => {
                            const next = window.prompt('Nouveau label');
                            if (next) setLabel(next);
                        }}
                    >
                        Nouveau label
                    </button>
                </div>
                <input value={ownerPseudo} readOnly aria-label="Propriétaire" />
                <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Lien optionnel" />
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description courte" rows={3} />
                <div className="modal-actions">
                    <button type="button" className="ghost-button" onClick={props.onClose}>Annuler</button>
                    <button type="button" className="primary-button" onClick={() => props.onSubmit({ title, label, ownerPseudo, url, description })} disabled={!title.trim()}>
                        ✓ Ajouter
                    </button>
                </div>
            </div>
        </div>
    );
}

function DailySummaryOverlay(props: {
    boardDate: string;
    focus: string;
    people: DailyPerson[];
    onClose: () => void;
}) {
    return (
        <aside className="summary-overlay">
            <div className="summary-overlay__header">
                <div className="summary-overlay__headline">
                    <h2>{formatHeaderDate(props.boardDate)}</h2>
                    {props.focus && <p>{props.focus}</p>}
                </div>
                <button type="button" className="ghost-button" onClick={props.onClose}>Fermer</button>
            </div>
            <div className="summary-grid summary-grid--header">
                <div>Personne</div>
                <div>Fait hier</div>
                <div>À faire</div>
                <div>En cours</div>
                <div>Bloqué</div>
                <div>Done</div>
            </div>
            <div className="summary-grid-body">
                {props.people.map((person) => (
                    <div key={person.pseudo} className="summary-grid">
                        <div className="summary-person-cell">
                            <strong>{person.pseudo}</strong>
                        </div>
                        <SummaryList notes={person.doneYesterday} />
                        <SummaryList notes={person.todo} />
                        <SummaryList notes={person.doing} />
                        <SummaryList notes={person.blocked} tone="danger" />
                        <SummaryList notes={person.done} />
                    </div>
                ))}
            </div>
        </aside>
    );
}

function SummaryList(props: { notes: DailyNote[]; tone?: 'danger' }) {
    if (props.notes.length === 0) {
        return <div className="summary-list summary-list--empty">—</div>;
    }

    return (
        <div className={`summary-list${props.tone === 'danger' ? ' summary-list--danger' : ''}`}>
            {props.notes.map((note) => (
                <div key={note.id} className="summary-note">
                    {note.title}
                </div>
            ))}
        </div>
    );
}

function getInitials(name: string) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}
function formatBoardDate(date: Date) {
    return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
}
function formatHeaderDate(date: string) {
    return new Date(`${date}T09:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function formatRelativeTime(date: string | undefined) {
    if (!date) return 'à l’instant';
    const deltaSeconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
    if (deltaSeconds < 10) return 'à l’instant';
    if (deltaSeconds < 60) return `il y a ${deltaSeconds}s`;
    return `il y a ${Math.floor(deltaSeconds / 60)} min`;
}
function formatMiniDate(date: string) {
    return new Date(date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function toYesterdayIso() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString();
}

function getNoteAgeState(note: DailyNote): 'warning' | 'alert' | null {
    if (note.column !== 'TODO' && note.column !== 'DOING') {
        return null;
    }

    const ageHours = (Date.now() - new Date(note.createdAt).getTime()) / (1000 * 60 * 60);
    if (ageHours >= 48) {
        return 'alert';
    }
    if (ageHours >= 24) {
        return 'warning';
    }
    return null;
}
