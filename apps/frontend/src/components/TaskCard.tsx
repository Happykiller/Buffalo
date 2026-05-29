import { useState, useEffect } from 'react';
import type { DailyTask } from '../pages/DailyBoardPage';
import { getTaskAgeState, formatMiniDate } from '../pages/DailyBoardPage';

interface TaskCardProps {
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
}

export default function TaskCard(props: TaskCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const ageState = getTaskAgeState(props.task);

    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [descriptionValue, setDescriptionValue] = useState(props.task.description || '');
    const [isEditingUrl, setIsEditingUrl] = useState(false);
    const [urlValue, setUrlValue] = useState(props.task.url || '');
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [labelValue, setLabelValue] = useState(props.task.label || '');

    useEffect(() => {
        setDescriptionValue(props.task.description || '');
    }, [props.task.description]);

    useEffect(() => {
        setUrlValue(props.task.url || '');
    }, [props.task.url]);

    useEffect(() => {
        setLabelValue(props.task.label || '');
    }, [props.task.label]);

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
                {props.canEdit && isEditingUrl ? (
                    <input
                        className="task-card__url-input"
                        value={urlValue}
                        autoFocus
                        placeholder="Lien optionnel (https://...)"
                        onChange={(event) => setUrlValue(event.target.value)}
                        onBlur={async () => {
                            setIsEditingUrl(false);
                            if (urlValue.trim() !== (props.task.url || '')) {
                                await props.onUpdate({ url: urlValue.trim() || null });
                            }
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                event.currentTarget.blur();
                            }
                            if (event.key === 'Escape') {
                                setUrlValue(props.task.url || '');
                                setIsEditingUrl(false);
                            }
                        }}
                    />
                ) : (
                    <div className="task-card__url-container">
                        {props.task.url ? (
                            <>
                                <a href={props.task.url} target="_blank" rel="noreferrer">Lien</a>
                                {props.canEdit && (
                                    <button
                                        type="button"
                                        className="task-card__edit-link-button"
                                        onClick={() => setIsEditingUrl(true)}
                                        title="Modifier le lien"
                                    >
                                        ✎
                                    </button>
                                )}
                            </>
                        ) : (
                            props.canEdit && (
                                <button
                                    type="button"
                                    className="task-card__add-link-button"
                                    onClick={() => setIsEditingUrl(true)}
                                >
                                    + Ajouter un lien
                                </button>
                            )
                        )}
                    </div>
                )}
            </div>

            {props.canEdit && isEditingDescription ? (
                <textarea
                    className="task-card__description-input"
                    value={descriptionValue}
                    autoFocus
                    placeholder="Description"
                    rows={2}
                    onChange={(event) => setDescriptionValue(event.target.value)}
                    onBlur={async () => {
                        setIsEditingDescription(false);
                        if (descriptionValue.trim() !== (props.task.description || '')) {
                            await props.onUpdate({ description: descriptionValue.trim() || null });
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            event.currentTarget.blur();
                        }
                        if (event.key === 'Escape') {
                            setDescriptionValue(props.task.description || '');
                            setIsEditingDescription(false);
                        }
                    }}
                />
            ) : (
                (props.task.description || props.canEdit) && (
                    <p
                        className={`task-card__description${props.canEdit ? ' task-card__description--editable' : ''}`}
                        onClick={props.canEdit ? () => setIsEditingDescription(true) : undefined}
                    >
                        {props.task.description || <span className="task-card__placeholder">+ Ajouter une description</span>}
                    </p>
                )
            )}

            <div className="task-card__footer">
                {props.canEdit && isEditingLabel ? (
                    <div className="task-card__label-editor">
                        <input
                            list={`labels-list-${props.task.id}`}
                            className="task-card__label-input"
                            value={labelValue}
                            autoFocus
                            placeholder="Label"
                            onChange={(event) => setLabelValue(event.target.value)}
                            onBlur={async () => {
                                setIsEditingLabel(false);
                                if (labelValue.trim() !== (props.task.label || '')) {
                                    await props.onUpdate({ label: labelValue.trim() || null });
                                }
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    event.currentTarget.blur();
                                }
                                if (event.key === 'Escape') {
                                    setLabelValue(props.task.label || '');
                                    setIsEditingLabel(false);
                                }
                            }}
                        />
                        <datalist id={`labels-list-${props.task.id}`}>
                            {props.labels.map((lbl) => (
                                <option key={lbl} value={lbl} />
                            ))}
                        </datalist>
                    </div>
                ) : (
                    <div className="task-card__footer-left">
                        {props.task.label ? (
                            <span
                                className={`task-chip${props.canEdit ? ' task-chip--editable' : ''}`}
                                onClick={props.canEdit ? () => setIsEditingLabel(true) : undefined}
                                title={props.canEdit ? "Modifier le label" : undefined}
                            >
                                {props.task.label}
                            </span>
                        ) : (
                            props.canEdit && (
                                <span
                                    className="task-chip task-chip--add"
                                    onClick={() => setIsEditingLabel(true)}
                                >
                                    + Label
                                </span>
                            )
                        )}
                    </div>
                )}

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
