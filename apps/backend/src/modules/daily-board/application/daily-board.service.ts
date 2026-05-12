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
        const board = await this.repository.getOrCreateBoard(date ?? getTodayBoardDate());
        const [notes, presence] = await Promise.all([
            this.repository.listNotes(board.id),
            this.repository.listPresence(board.id, new Date(Date.now() - 2 * 60 * 1000)),
        ]);

        return {
            board,
            blockers: notes.filter((note) => note.column === DailyNoteColumn.BLOCKED),
            people: buildPersonSections(notes, presence, currentPseudo).map((person) => ({
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
