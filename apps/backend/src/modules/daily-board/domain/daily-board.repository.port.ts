import { DailyHistoryFilter } from './daily-history-filter.enum';
import { DailyNoteColumn } from './daily-note-column.enum';

export interface DailyBoardEntity {
    id: string;
    date: string;
    focus: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DailyNoteEntity {
    id: string;
    authorPseudo: string;
    column: DailyNoteColumn;
    title: string;
    description: string | null;
    label: string | null;
    url: string | null;
    done: boolean;
    blockedSince: Date | null;
    doingSince: Date | null;
    doneAt: Date | null;
    helpNeeded: string | null;
    unblockAssignedTo: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface DailyPresenceEntity {
    id: string;
    pseudo: string;
    boardId: string;
    lastSeenAt: Date;
    editingSectionId: string | null;
}

export interface CreateDailyNoteData {
    authorPseudo: string;
    column: DailyNoteColumn;
    title: string;
    createdAt?: Date | null;
    description?: string | null;
    label?: string | null;
    url?: string | null;
    blockedSince?: Date | null;
    doneAt?: Date | null;
    helpNeeded?: string | null;
    unblockAssignedTo?: string | null;
}

export interface UpdateDailyNoteData {
    authorPseudo?: string;
    column?: DailyNoteColumn;
    title?: string;
    description?: string | null;
    label?: string | null;
    url?: string | null;
    done?: boolean;
    blockedSince?: Date | null;
    doingSince?: Date | null;
    doneAt?: Date | null;
    helpNeeded?: string | null;
    unblockAssignedTo?: string | null;
}

export interface DailyHistoryEntry {
    board: DailyBoardEntity;
    notes: DailyNoteEntity[];
}

export interface DailyBoardRepositoryPort {
    getOrCreateBoard(date: string): Promise<DailyBoardEntity>;
    updateBoardFocus(date: string, focus: string): Promise<DailyBoardEntity>;
    listNotes(date: string): Promise<DailyNoteEntity[]>;
    listRecentlyDoneNotes(beforeDate: string, daysBack: number): Promise<DailyNoteEntity[]>;
    findNoteById(id: string): Promise<DailyNoteEntity | null>;
    createNote(data: CreateDailyNoteData): Promise<DailyNoteEntity>;
    updateNote(id: string, patch: UpdateDailyNoteData): Promise<DailyNoteEntity | null>;
    softDeleteNote(id: string): Promise<DailyNoteEntity | null>;
    restoreNote(id: string): Promise<DailyNoteEntity | null>;
    upsertPresence(boardId: string, pseudo: string, editingSectionId?: string | null): Promise<DailyPresenceEntity>;
    listPresence(boardId: string, activeSince: Date): Promise<DailyPresenceEntity[]>;
    listHistory(from?: string, to?: string, filter?: DailyHistoryFilter): Promise<DailyHistoryEntry[]>;
}

export const DAILY_BOARD_REPOSITORY = Symbol('DAILY_BOARD_REPOSITORY');
