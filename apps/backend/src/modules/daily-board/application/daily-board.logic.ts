import {
    DailyBoardEntity,
    DailyNoteEntity,
    DailyPresenceEntity,
    UpdateDailyNoteData,
} from '../domain/daily-board.repository.port';
import { DailyHistoryFilter } from '../domain/daily-history-filter.enum';
import { DailyHistoryGroupBy } from '../domain/daily-history-group-by.enum';
import { DailyNoteColumn } from '../domain/daily-note-column.enum';

export interface DailyBoardPersonSection {
    pseudo: string;
    status: 'ONLINE' | 'ABSENT' | 'EDITING';
    notes: Record<DailyNoteColumn, DailyNoteEntity[]>;
    donePreviously: DailyNoteEntity[];
}

export interface DailyHistoryEvent {
    id: string;
    pseudo: string;
    kind: 'DONE' | 'BLOCKER' | 'DECISION' | 'NOTE';
    title: string;
    label: string | null;
    column: DailyNoteColumn;
    createdAt: Date;
}

export interface DailyHistoryDayGroup {
    board: DailyBoardEntity;
    focus: string;
    events: DailyHistoryEvent[];
    people: Array<{
        pseudo: string;
        items: DailyHistoryEvent[];
    }>;
}

export function getTodayBoardDate(now = new Date()): string {
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getPreviousBoardDate(date: string): string {
    const previous = new Date(`${date}T12:00:00`);
    previous.setDate(previous.getDate() - 1);
    return getTodayBoardDate(previous);
}

export function sanitizeNotePatch(patch: UpdateDailyNoteData): UpdateDailyNoteData {
    const sanitized = { ...patch };
    if (typeof sanitized.title === 'string') {
        sanitized.title = sanitized.title.trim();
    }
    if (sanitized.column === DailyNoteColumn.BLOCKED && sanitized.blockedSince === undefined) {
        sanitized.blockedSince = new Date();
    }
    if (sanitized.column && sanitized.column !== DailyNoteColumn.BLOCKED) {
        sanitized.blockedSince = sanitized.blockedSince ?? null;
        sanitized.helpNeeded = sanitized.helpNeeded ?? null;
        sanitized.unblockAssignedTo = sanitized.unblockAssignedTo ?? null;
    }
    if (sanitized.column === DailyNoteColumn.DOING && sanitized.doingSince === undefined) {
        sanitized.doingSince = new Date();
    }
    if (sanitized.column && sanitized.column !== DailyNoteColumn.DOING) {
        sanitized.doingSince = null;
    }
    if (sanitized.column === DailyNoteColumn.DONE && sanitized.done === undefined) {
        sanitized.done = true;
        sanitized.doneAt = sanitized.doneAt ?? new Date();
    }
    if (sanitized.column && sanitized.column !== DailyNoteColumn.DONE) {
        sanitized.done = false;
        sanitized.doneAt = null;
    }
    return sanitized;
}

export function buildPersonSections(
    notes: DailyNoteEntity[],
    presence: DailyPresenceEntity[],
    currentPseudo?: string,
    previouslyDoneNotes: DailyNoteEntity[] = [],
): DailyBoardPersonSection[] {
    const pseudos = new Set<string>(notes.map((note) => note.authorPseudo));
    for (const note of previouslyDoneNotes) {
        pseudos.add(note.authorPseudo);
    }
    for (const item of presence) {
        pseudos.add(item.pseudo);
    }
    if (currentPseudo) {
        pseudos.add(currentPseudo);
    }

    const presenceByPseudo = new Map(presence.map((item) => [item.pseudo, item]));
    const sections = [...pseudos]
        .sort((a, b) => {
            if (currentPseudo) {
                if (a === currentPseudo && b !== currentPseudo) return -1;
                if (b === currentPseudo && a !== currentPseudo) return 1;
            }
            return a.localeCompare(b, 'fr');
        })
        .map((pseudo) => {
            const presenceItem = presenceByPseudo.get(pseudo);
            const status: DailyBoardPersonSection['status'] = presenceItem?.editingSectionId
                ? 'EDITING'
                : presenceItem
                    ? 'ONLINE'
                    : 'ABSENT';

            const sectionNotes = notes.filter((note) => note.authorPseudo === pseudo);

            return {
                pseudo,
                status,
                notes: {
                    [DailyNoteColumn.TODO]: sectionNotes.filter((note) => note.column === DailyNoteColumn.TODO),
                    [DailyNoteColumn.DOING]: sectionNotes.filter((note) => note.column === DailyNoteColumn.DOING),
                    [DailyNoteColumn.BLOCKED]: sectionNotes.filter((note) => note.column === DailyNoteColumn.BLOCKED),
                    [DailyNoteColumn.DONE]: sectionNotes.filter((note) => note.column === DailyNoteColumn.DONE),
                },
                donePreviously: previouslyDoneNotes.filter((note) => note.authorPseudo === pseudo).slice(0, 3),
            };
        });

    return sections;
}

export function buildHistoryGroups(
    entries: Array<{ board: DailyBoardEntity; notes: DailyNoteEntity[] }>,
    _groupBy: DailyHistoryGroupBy,
    filter: DailyHistoryFilter,
): DailyHistoryDayGroup[] {
    return entries.map(({ board, notes }) => {
        const events = notes
            .filter((note) => matchesHistoryFilter(note, filter))
            .map((note) => ({
                id: note.id,
                pseudo: note.authorPseudo,
                kind: classifyHistoryKind(note),
                title: note.title,
                label: note.label,
                column: note.column,
                createdAt: note.updatedAt,
            }))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const peopleMap = new Map<string, DailyHistoryEvent[]>();
        for (const event of events) {
            const personEvents = peopleMap.get(event.pseudo) ?? [];
            personEvents.push(event);
            peopleMap.set(event.pseudo, personEvents);
        }

        return {
            board,
            focus: board.focus,
            events,
            people: [...peopleMap.entries()].map(([pseudo, items]) => ({ pseudo, items })),
        };
    });
}

function matchesHistoryFilter(note: DailyNoteEntity, filter: DailyHistoryFilter) {
    switch (filter) {
        case DailyHistoryFilter.DONE:
            return note.done || note.column === DailyNoteColumn.DONE;
        case DailyHistoryFilter.BLOCKERS:
            return note.column === DailyNoteColumn.BLOCKED;
        case DailyHistoryFilter.DECISIONS:
            return classifyHistoryKind(note) === 'DECISION';
        case DailyHistoryFilter.ALL:
        default:
            return true;
    }
}

function classifyHistoryKind(note: DailyNoteEntity): DailyHistoryEvent['kind'] {
    if (note.column === DailyNoteColumn.BLOCKED) {
        return 'BLOCKER';
    }
    if (note.done || note.column === DailyNoteColumn.DONE) {
        return 'DONE';
    }
    if (/decision|report/i.test(note.label ?? '') || /decision|report/i.test(note.title)) {
        return 'DECISION';
    }
    return 'NOTE';
}

