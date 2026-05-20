import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { useOutletContext } from 'react-router-dom';
import { GET_DAILY_BOARD } from '../graphql/queries';
import {
    CREATE_DAILY_TASK,
    DELETE_DAILY_TASK,
    HEARTBEAT_DAILY_PRESENCE,
    RESTORE_DAILY_TASK,
    UPDATE_DAILY_FOCUS,
    UPDATE_DAILY_TASK,
} from '../graphql/mutations';
import {
    DAILY_BOARD_UPDATED_SUBSCRIPTION,
    DAILY_PRESENCE_CHANGED_SUBSCRIPTION,
} from '../graphql/subscriptions';
import type { UserShellContext } from '../types/user-shell-context';

type TaskColumn = 'TODO' | 'DOING' | 'BLOCKED' | 'DONE';
type CreateColumn = TaskColumn | 'DONE_YESTERDAY';
type PersonStatus = 'ONLINE' | 'ABSENT' | 'EDITING';

interface DailyTask {
    id: string;
    authorPseudo: string;
    authorPseudo: string;
    column: TaskColumn;
    title: string;
    description: string | null;
    label: string | null;
    url: string | null;
    done: boolean;
    blockedSince: string | null;
    doingSince: string | null;
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
    donePreviously: DailyTask[];
    todo: DailyTask[];
    doing: DailyTask[];
    blocked: DailyTask[];
    done: DailyTask[];
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
        blockers: DailyTask[];
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
    taskId: string;
    label: string;
}

interface DragState {
    task: DailyTask;
    authorPseudo: string;
    column: TaskColumn;
}

const BOARD_DATE = formatBoardDate(new Date());
const WORKFLOW_COLUMNS: Array<{ key: TaskColumn; title: string }> = [
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
    const [draggedTask, setDraggedTask] = useState<DragState | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);
    const [hiddenPseudos, setHiddenPseudos] = useState<Set<string>>(new Set());

    const { data, loading, error, refetch } = useQuery<DailyBoardData>(GET_DAILY_BOARD, {
        variables: { date: BOARD_DATE, currentPseudo: user.displayName },
        fetchPolicy: 'cache-and-network',
    });

    const [createTask] = useMutation(CREATE_DAILY_TASK);
    const [updateTask] = useMutation(UPDATE_DAILY_TASK);
    const [deleteTask] = useMutation(DELETE_DAILY_TASK);
    const [restoreTask] = useMutation(RESTORE_DAILY_TASK);
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

    async function handleCreateTask(values: { title: string; label?: string; authorPseudo: string; url?: string; description?: string }) {
        if (!createModal) return;
        await createTask({
            variables: {
                input: {
                    boardDate: BOARD_DATE,
                    authorPseudo: values.authorPseudo,
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

    async function handleInlineTitleSave(taskId: string) {
        const title = editingTitleValue.trim();
        if (!title) {
            setEditingTitleId(null);
            return;
        }
        await updateTask({ variables: { noteId: taskId, input: { title } } });
        setEditingTitleId(null);
        setEditingSectionId(null);
        await refetch();
    }

    async function handleDelete(task: DailyTask) {
        await deleteTask({ variables: { noteId: task.id } });
        setToast({ taskId: task.id, label: task.title });
        await refetch();
    }

    async function handleRestore(taskId: string) {
        await restoreTask({ variables: { noteId: taskId } });
        setToast(null);
        await refetch();
    }

    async function handleDropOnColumn(authorPseudo: string, column: TaskColumn) {
        if (!draggedTask) return;
        if (draggedTask.authorPseudo === authorPseudo && draggedTask.column === column) {
            setDraggedTask(null);
            setDropTarget(null);
            return;
        }
        await updateTask({
            variables: {
                noteId: draggedTask.task.id,
                input: {
                    column,
                    helpNeeded: column === 'BLOCKED' ? draggedTask.task.helpNeeded : null,
                    unblockAssignedTo: column === 'BLOCKED' ? draggedTask.task.unblockAssignedTo : null,
                },
            },
        });
        setDraggedTask(null);
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
                    <button type="button" className="ghost-button" onClick={() => setHistoryOpen(true)}>Daily Meeting</button>
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
                    {board.blockers.map((task) => (
                        <div key={task.id} className="blocker-row">
                            <div>
                                <strong>{task.title}</strong>
                                <div className="blocker-meta">
                                    <span>{task.blockedSince ? `depuis ${formatRelativeTime(task.blockedSince)}` : 'bloqué maintenant'}</span>
                                    {task.helpNeeded && <span>{task.helpNeeded}</span>}
                                    {task.url && <a href={task.url} target="_blank" rel="noreferrer">Lien</a>}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="danger-ghost-button"
                                onClick={() => void handleDropOnColumn(task.authorPseudo, 'DOING')}
                                disabled={task.authorPseudo !== user.displayName}
                            >
                                Déplacer en cours
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="people-board">
                {hiddenPseudos.size > 0 && (
                    <div className="hidden-people-bar">
                        <span>{hiddenPseudos.size} absent{hiddenPseudos.size > 1 ? 's' : ''} masqué{hiddenPseudos.size > 1 ? 's' : ''}</span>
                        <button
                            type="button"
                            className="ghost-button"
                            onClick={() => setHiddenPseudos(new Set())}
                        >
                            Afficher tous
                        </button>
                    </div>
                )}
                {board.people.filter((p) => !hiddenPseudos.has(p.pseudo)).map((person) => (
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
                            {person.status === 'ABSENT' && (
                                <button
                                    type="button"
                                    className="hide-person-button"
                                    title={`Masquer ${person.pseudo}`}
                                    onClick={() => setHiddenPseudos((prev) => new Set([...prev, person.pseudo]))}
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        {(() => {
                            const isCurrentUserRow = person.pseudo === user.displayName;
                            return (
                        <div className="person-row__grid person-row__grid--five">
                            <section className="person-column person-column--history">
                                <header className="person-column__header"><h3>Fait précédemment</h3></header>
                                <div className="person-column__tasks">
                                    {person.donePreviously.map((task) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            labels={board.labels}
                                            isHistorical
                                            isEditing={editingTitleId === task.id}
                                            editingTitleValue={editingTitleValue}
                                            canEdit={isCurrentUserRow}
                                            onDragEnd={() => {
                                                setDraggedTask(null);
                                                setDropTarget(null);
                                            }}
                                            onDragStart={(task) => {
                                                setDraggedTask(task ? {
                                                    task,
                                                    authorPseudo: person.pseudo,
                                                    column: task.column,
                                                } : null);
                                                setDropTarget(null);
                                            }}
                                            onTitleEditStart={() => {
                                                setEditingTitleId(task.id);
                                                setEditingTitleValue(task.title);
                                                setEditingSectionId(`person:${person.pseudo}`);
                                            }}
                                            onTitleEditChange={setEditingTitleValue}
                                            onTitleEditSave={() => void handleInlineTitleSave(task.id)}
                                            onTitleEditCancel={() => {
                                                setEditingTitleId(null);
                                                setEditingSectionId(null);
                                            }}
                                            onUpdate={async (input) => {
                                                await updateTask({ variables: { noteId: task.id, input } });
                                                await refetch();
                                            }}
                                            onDelete={() => void handleDelete(task)}
                                        />
                                    ))}
                                </div>
                                {isCurrentUserRow && (
                                    <button
                                        type="button"
                                        className="add-task-button"
                                        onClick={() => setCreateModal({ pseudo: person.pseudo, column: 'DONE_YESTERDAY' })}
                                    >
                                        + Ajouter une tâche…
                                    </button>
                                )}
                            </section>

                            {WORKFLOW_COLUMNS.map((column) => {
                                const columnTasks = person[column.key.toLowerCase() as 'todo' | 'doing' | 'blocked' | 'done'];
                                const targetKey = `${person.pseudo}:${column.key}`;
                                const isOriginColumn =
                                    draggedTask?.authorPseudo === person.pseudo && draggedTask.column === column.key;
                                const isDroppable = Boolean(draggedTask && isCurrentUserRow && !isOriginColumn);
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
                                        <div className="person-column__tasks">
                                            {columnTasks.map((task) => (
                                                <TaskCard
                                                    key={task.id}
                                                    task={task}
                                                    labels={board.labels}
                                                    isHistorical={false}
                                                    isEditing={editingTitleId === task.id}
                                                    editingTitleValue={editingTitleValue}
                                                    canEdit={isCurrentUserRow}
                                                    onDragEnd={() => {
                                                        setDraggedTask(null);
                                                        setDropTarget(null);
                                                    }}
                                                    onDragStart={(task) => {
                                                        setDraggedTask(task ? {
                                                            task,
                                                            authorPseudo: person.pseudo,
                                                            column: task.column,
                                                        } : null);
                                                        setDropTarget(null);
                                                    }}
                                                    onTitleEditStart={() => {
                                                        setEditingTitleId(task.id);
                                                        setEditingTitleValue(task.title);
                                                        setEditingSectionId(`person:${person.pseudo}`);
                                                    }}
                                                    onTitleEditChange={setEditingTitleValue}
                                                    onTitleEditSave={() => void handleInlineTitleSave(task.id)}
                                                    onTitleEditCancel={() => {
                                                        setEditingTitleId(null);
                                                        setEditingSectionId(null);
                                                    }}
                                                    onUpdate={async (input) => {
                                                        await updateTask({ variables: { noteId: task.id, input } });
                                                        await refetch();
                                                    }}
                                                    onDelete={() => void handleDelete(task)}
                                                />
                                            ))}
                                        </div>
                                        {isCurrentUserRow && (
                                            <button
                                                type="button"
                                                className="add-task-button"
                                                onClick={() => setCreateModal({ pseudo: person.pseudo, column: column.key })}
                                            >
                                                + Ajouter une tâche…
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
                <CreateTaskModal
                    labels={[...new Set([...LABEL_SWATCHES, ...board.labels].filter(Boolean))]}
                    defaultOwner={createModal.pseudo}
                    currentUser={user.displayName}
                    onClose={() => {
                        setCreateModal(null);
                        setEditingSectionId(null);
                    }}
                    onSubmit={(values) => void handleCreateTask(values)}
                />
            )}

            {historyOpen && (
                <DailySummaryOverlay
                    boardDate={board.board.date}
                    focus={board.board.focus}
                    people={board.people.filter((p) => !hiddenPseudos.has(p.pseudo))}
                    onClose={() => setHistoryOpen(false)}
                />
            )}

            {toast && (
                <div className="daily-toast">
                    <span>Tâche supprimée · {toast.label}</span>
                    <button type="button" onClick={() => void handleRestore(toast.taskId)}>Annuler</button>
                </div>
            )}
        </div>
    );
}

function TaskCard(props: {
    task: DailyTask;
    labels: string[];
    isHistorical?: boolean;
    isEditing: boolean;
    editingTitleValue: string;
    canEdit: boolean;
    onDragStart: (task: DailyTask | null) => void;
    onDragEnd: () => void;
    onTitleEditStart: () => void;
    onTitleEditChange: (value: string) => void;
    onTitleEditSave: () => void;
    onTitleEditCancel: () => void;
    onUpdate: (input: Record<string, unknown>) => Promise<void>;
    onDelete: () => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const ageState = getTaskAgeState(props.task);

    return (
        <div
            className={`task-card${props.task.column === 'BLOCKED' ? ' task-card--blocker' : ''}${ageState ? ` task-card--${ageState}` : ''}`}
            draggable={props.canEdit && !props.isHistorical}
            onDragStart={() => {
                if (props.canEdit && !props.isHistorical) {
                    props.onDragStart(props.task);
                }
            }}
            onDragEnd={props.onDragEnd}
        >
            <div className="task-card__top">
                {!props.isHistorical && props.canEdit && (
                    <span className="task-card__drag-grip" title="Glisser-déposer" aria-hidden="true">
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
                        className="task-card__title-input"
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
                    <button type="button" className="task-card__title" onClick={props.canEdit ? props.onTitleEditStart : undefined}>{props.task.title}</button>
                )}
                {props.canEdit && (
                    <button type="button" className="task-menu-button" onClick={() => setMenuOpen((value) => !value)}>···</button>
                )}
            </div>

            <div className="task-card__meta">
                {props.task.url && <a href={props.task.url} target="_blank" rel="noreferrer">Lien</a>}
            </div>
            {props.task.description && <p className="task-card__description">{props.task.description}</p>}
            <div className="task-card__footer">
                <div className="task-card__footer-left">
                    {props.task.label && <span className="task-chip">{props.task.label}</span>}
                </div>
                <div className="task-card__info">
                    <button type="button" className="task-card__info-button" aria-label="Informations de la tâche">
                        i
                    </button>
                    <div className="task-card__tooltip">
                        <span>Créée {formatMiniDate(props.task.createdAt)}</span>
                        <span>Modifiée {formatMiniDate(props.task.updatedAt)}</span>
                        {props.task.doneAt && <span>Finie {formatMiniDate(props.task.doneAt)}</span>}
                    </div>
                </div>
            </div>

            {props.canEdit && menuOpen && (
                <div className="task-menu">
                    <button type="button" className="task-menu__danger" onClick={props.onDelete}>Supprimer</button>
                </div>
            )}
        </div>
    );
}

function CreateTaskModal(props: {
    labels: string[];
    defaultOwner: string;
    currentUser: string;
    onClose: () => void;
    onSubmit: (values: { title: string; label?: string; authorPseudo: string; url?: string; description?: string }) => void;
}) {
    const [title, setTitle] = useState('');
    const [label, setLabel] = useState('');
    const authorPseudo = props.defaultOwner || props.currentUser;
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');

    return (
        <div className="modal-backdrop" onClick={props.onClose}>
            <div className="create-task-modal" onClick={(event) => event.stopPropagation()}>
                <h2>Ajouter une tâche</h2>
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
                <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Lien optionnel" />
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description courte" rows={3} />
                <div className="modal-actions">
                    <button type="button" className="ghost-button" onClick={props.onClose}>Annuler</button>
                    <button type="button" className="primary-button" onClick={() => props.onSubmit({ title, label, authorPseudo, url, description })} disabled={!title.trim()}>
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
    const [hiddenPseudos, setHiddenPseudos] = useState<Set<string>>(new Set());
    const visible = props.people.filter((p) => !hiddenPseudos.has(p.pseudo));
    const hiddenCount = hiddenPseudos.size;

    return (
        <aside className="summary-overlay">
            <div className="summary-overlay__header">
                <div className="summary-overlay__headline">
                    <h2>{formatHeaderDate(props.boardDate)}</h2>
                    {props.focus && <p>{props.focus}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {hiddenCount > 0 && (
                        <button
                            type="button"
                            className="ghost-button"
                            onClick={() => setHiddenPseudos(new Set())}
                        >
                            {hiddenCount} masqué{hiddenCount > 1 ? 's' : ''} · Afficher tous
                        </button>
                    )}
                    <button type="button" className="ghost-button" onClick={props.onClose}>Fermer</button>
                </div>
            </div>
            <div className="summary-grid summary-grid--header">
                <div>Personne</div>
                <div>Fait précédemment</div>
                <div>À faire</div>
                <div>En cours</div>
                <div>Bloqué</div>
                <div>Done</div>
            </div>
            <div className="summary-grid-body">
                {visible.map((person) => (
                    <div key={person.pseudo} className="summary-grid">
                        <div className="summary-person-cell summary-person-cell--interactive">
                            <strong>{person.pseudo}</strong>
                            <button
                                type="button"
                                className="summary-hide-button"
                                title={`Masquer ${person.pseudo}`}
                                onClick={() => setHiddenPseudos((prev) => new Set([...prev, person.pseudo]))}
                            >
                                ×
                            </button>
                        </div>
                        <SummaryList tasks={person.donePreviously} />
                        <SummaryList tasks={person.todo} />
                        <SummaryList tasks={person.doing} />
                        <SummaryList tasks={person.blocked} tone="danger" />
                        <SummaryList tasks={person.done} />
                    </div>
                ))}
            </div>
        </aside>
    );
}

function SummaryList(props: { tasks: DailyTask[]; tone?: 'danger' }) {
    if (props.tasks.length === 0) {
        return <div className="summary-list summary-list--empty">—</div>;
    }

    return (
        <div className={`summary-list${props.tone === 'danger' ? ' summary-list--danger' : ''}`}>
            {props.tasks.map((task) => (
                <div
                    key={task.id}
                    className={`summary-task${getTaskAgeState(task) ? ` summary-task--${getTaskAgeState(task)}` : ''}${task.column === 'BLOCKED' ? ' summary-task--blocker' : ''}`}
                    title={task.title}
                >
                    {task.title}
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

function getTaskAgeState(task: DailyTask): 'warning' | 'alert' | null {
    if (task.column !== 'TODO' && task.column !== 'DOING') {
        return null;
    }

    const startTime = task.column === 'DOING'
        ? new Date(task.doingSince ?? task.createdAt).getTime()
        : new Date(task.createdAt).getTime();

    const ageHours = (Date.now() - startTime) / (1000 * 60 * 60);
    if (ageHours >= 48) {
        return 'alert';
    }
    if (ageHours >= 24) {
        return 'warning';
    }
    return null;
}
