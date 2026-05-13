import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
    CreateDailyNoteData,
    DAILY_BOARD_REPOSITORY,
    DailyBoardRepositoryPort,
    UpdateDailyNoteData,
} from '../domain/daily-board.repository.port';
import { DailyHistoryFilter } from '../domain/daily-history-filter.enum';
import { DailyHistoryGroupBy } from '../domain/daily-history-group-by.enum';
import { DailyNoteColumn } from '../domain/daily-note-column.enum';
import {
    buildHistoryGroups,
    buildPersonSections,
    getPreviousBoardDate,
    getTodayBoardDate,
    sanitizeNotePatch,
} from './daily-board.logic';

@Injectable()
export class DailyBoardService {
    constructor(
        @Inject(DAILY_BOARD_REPOSITORY)
        private readonly repository: DailyBoardRepositoryPort,
    ) { }

    async getBoard(date?: string, currentPseudo?: string) {
        const boardDate = date ?? getTodayBoardDate();
        const board = await this.repository.getOrCreateBoard(boardDate);
        let [notes, allCurrentBoardNotes, presence] = await Promise.all([
            this.repository.listNotes(board.id),
            this.repository.listNotes(board.id, true),
            this.repository.listPresence(board.id, new Date(Date.now() - 2 * 60 * 1000)),
        ]);
        const previousBoardDate = getPreviousBoardDate(boardDate);
        const previousDayHistory = await this.repository.listHistory(
            previousBoardDate,
            previousBoardDate,
            DailyHistoryFilter.ALL,
        );
        const previousDayNotes = previousDayHistory[0]?.notes ?? [];

        notes = deduplicateCarryOverNotes(notes);

        const carryOverNotes = previousDayNotes
            .filter((note) => note.column !== DailyNoteColumn.DONE)
            .filter((note) => !allCurrentBoardNotes.some((currentNote) => hasSameCarryOverIdentity(currentNote, note)));
        if (carryOverNotes.length > 0) {
            await Promise.all(carryOverNotes.map((note) => (
                this.repository.createNote(board.id, {
                    ownerPseudo: note.ownerPseudo,
                    authorPseudo: note.authorPseudo,
                    column: note.column,
                    title: note.title,
                    createdAt: note.createdAt,
                    description: note.description,
                    label: note.label,
                    url: note.url,
                    blockedSince: note.blockedSince,
                    doneAt: null,
                    helpNeeded: note.helpNeeded,
                    unblockAssignedTo: note.unblockAssignedTo,
                })
            )));
            notes = deduplicateCarryOverNotes(await this.repository.listNotes(board.id));
            allCurrentBoardNotes = await this.repository.listNotes(board.id, true);
        }

        const doneYesterdayNotes = previousDayNotes.filter((note) => note.column === DailyNoteColumn.DONE);

        return {
            board,
            blockers: notes.filter((note) => note.column === DailyNoteColumn.BLOCKED),
            people: buildPersonSections(notes, presence, currentPseudo, doneYesterdayNotes).map((person) => ({
                pseudo: person.pseudo,
                status: person.status,
                doneYesterday: person.doneYesterday,
                todo: person.notes[DailyNoteColumn.TODO],
                doing: person.notes[DailyNoteColumn.DOING],
                blocked: person.notes[DailyNoteColumn.BLOCKED],
                done: person.notes[DailyNoteColumn.DONE],
            })),
            presence,
            connectedCount: presence.length,
            savedAt: board.updatedAt > maxNoteUpdate(notes) ? board.updatedAt : maxNoteUpdate(notes),
            labels: [...new Set(notes.map((note) => note.label).filter(Boolean))],
            notes,
        };
    }

    async createNote(date: string | undefined, data: CreateDailyNoteData) {
        const board = await this.repository.getOrCreateBoard(date ?? getTodayBoardDate());
        return this.repository.createNote(board.id, {
            ...data,
            title: data.title.trim(),
            blockedSince:
                data.column === DailyNoteColumn.BLOCKED ? data.blockedSince ?? new Date() : null,
            doneAt: data.column === DailyNoteColumn.DONE ? data.doneAt ?? new Date() : null,
        });
    }

    async updateNote(id: string, patch: UpdateDailyNoteData) {
        const sanitized = sanitizeNotePatch(patch);
        const note = await this.repository.updateNote(id, sanitized);
        if (!note) {
            throw new NotFoundException(`Daily note ${id} not found`);
        }
        return note;
    }

    async deleteNote(id: string) {
        const note = await this.repository.softDeleteNote(id);
        if (!note) {
            throw new NotFoundException(`Daily note ${id} not found`);
        }
        return note;
    }

    async restoreNote(id: string) {
        const note = await this.repository.restoreNote(id);
        if (!note) {
            throw new NotFoundException(`Daily note ${id} not found`);
        }
        return note;
    }

    async updateFocus(date: string | undefined, focus: string) {
        return this.repository.updateBoardFocus(date ?? getTodayBoardDate(), focus.trim());
    }

    async heartbeatPresence(date: string | undefined, pseudo: string, editingSectionId?: string | null) {
        const board = await this.repository.getOrCreateBoard(date ?? getTodayBoardDate());
        return this.repository.upsertPresence(board.id, pseudo, editingSectionId);
    }

    async getHistory(from?: string, to?: string, groupBy = DailyHistoryGroupBy.DAY_PERSON, filter = DailyHistoryFilter.ALL) {
        const entries = await this.repository.listHistory(from, to, filter);
        return buildHistoryGroups(entries, groupBy, filter);
    }
}

function maxNoteUpdate(notes: Array<{ updatedAt: Date }>) {
    return notes.reduce((latest, note) => (
        note.updatedAt.getTime() > latest.getTime() ? note.updatedAt : latest
    ), new Date(0));
}

type CarryOverComparableNote = {
    ownerPseudo: string;
    column: DailyNoteColumn;
    title: string;
    description: string | null;
    label: string | null;
    url: string | null;
    updatedAt: Date;
};

function deduplicateCarryOverNotes<T extends CarryOverComparableNote>(notes: T[]): T[] {
    const notesByIdentity = new Map<string, T>();

    for (const note of notes) {
        const identity = getCarryOverIdentity(note);
        const existing = notesByIdentity.get(identity);
        if (!existing || shouldPreferCarryOverNote(note, existing)) {
            notesByIdentity.set(identity, note);
        }
    }

    return [...notesByIdentity.values()];
}

function shouldPreferCarryOverNote(candidate: CarryOverComparableNote, existing: CarryOverComparableNote) {
    const candidateRank = getColumnRank(candidate.column);
    const existingRank = getColumnRank(existing.column);
    if (candidateRank !== existingRank) {
        return candidateRank > existingRank;
    }

    return candidate.updatedAt.getTime() > existing.updatedAt.getTime();
}

function getColumnRank(column: DailyNoteColumn) {
    switch (column) {
        case DailyNoteColumn.BLOCKED:
            return 4;
        case DailyNoteColumn.DOING:
            return 3;
        case DailyNoteColumn.TODO:
            return 2;
        case DailyNoteColumn.DONE:
            return 1;
    }
}

function hasSameCarryOverIdentity(currentNote: CarryOverComparableNote, previousNote: CarryOverComparableNote) {
    return getCarryOverIdentity(currentNote) === getCarryOverIdentity(previousNote);
}

function getCarryOverIdentity(note: CarryOverComparableNote) {
    return [
        note.ownerPseudo,
        note.title,
        note.description ?? '',
        note.label ?? '',
        note.url ?? '',
    ].join('\u0000');
}
