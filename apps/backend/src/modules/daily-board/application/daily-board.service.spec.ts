import test from 'node:test';
import assert from 'node:assert/strict';
import { DailyBoardService } from './daily-board.service';
import {
    CreateDailyNoteData,
    DailyBoardEntity,
    DailyBoardRepositoryPort,
    DailyHistoryEntry,
    DailyNoteEntity,
    DailyPresenceEntity,
    UpdateDailyNoteData,
} from '../domain/daily-board.repository.port';
import { DailyHistoryFilter } from '../domain/daily-history-filter.enum';
import { DailyNoteColumn } from '../domain/daily-note-column.enum';

class FakeDailyBoardRepository implements DailyBoardRepositoryPort {
    board: DailyBoardEntity = {
        id: 'board-1',
        date: '2026-05-12',
        focus: '',
        createdAt: new Date('2026-05-12T08:00:00Z'),
        updatedAt: new Date('2026-05-12T08:00:00Z'),
    };

    notes: DailyNoteEntity[] = [];
    presence: DailyPresenceEntity[] = [];
    sequence = 0;

    async getOrCreateBoard(date: string): Promise<DailyBoardEntity> {
        this.board.date = date;
        return this.board;
    }

    async updateBoardFocus(date: string, focus: string): Promise<DailyBoardEntity> {
        this.board.date = date;
        this.board.focus = focus;
        this.board.updatedAt = new Date('2026-05-12T08:10:00Z');
        return this.board;
    }

    async listNotes(boardId: string, includeDeleted = false): Promise<DailyNoteEntity[]> {
        return this.notes.filter((note) => note.boardId === boardId && (includeDeleted || note.deletedAt === null));
    }

    async findNoteById(id: string): Promise<DailyNoteEntity | null> {
        return this.notes.find((note) => note.id === id) ?? null;
    }

    async createNote(boardId: string, data: CreateDailyNoteData): Promise<DailyNoteEntity> {
        const note: DailyNoteEntity = {
            id: `note-${++this.sequence}`,
            boardId,
            ownerPseudo: data.ownerPseudo,
            authorPseudo: data.authorPseudo,
            column: data.column,
            title: data.title,
            description: data.description ?? null,
            label: data.label ?? null,
            url: data.url ?? null,
            done: data.column === DailyNoteColumn.DONE,
            blockedSince: data.column === DailyNoteColumn.BLOCKED ? data.blockedSince ?? new Date('2026-05-12T08:00:00Z') : null,
            doneAt: data.column === DailyNoteColumn.DONE ? data.doneAt ?? new Date('2026-05-12T08:00:00Z') : null,
            helpNeeded: data.helpNeeded ?? null,
            unblockAssignedTo: data.unblockAssignedTo ?? null,
            deletedAt: null,
            createdAt: new Date('2026-05-12T08:00:00Z'),
            updatedAt: new Date('2026-05-12T08:00:00Z'),
        };
        this.notes.push(note);
        return note;
    }

    async updateNote(id: string, patch: UpdateDailyNoteData): Promise<DailyNoteEntity | null> {
        const note = this.notes.find((item) => item.id === id) ?? null;
        if (!note) {
            return null;
        }

        Object.assign(note, patch);
        note.updatedAt = new Date('2026-05-12T08:05:00Z');
        return note;
    }

    async softDeleteNote(id: string): Promise<DailyNoteEntity | null> {
        const note = this.notes.find((item) => item.id === id) ?? null;
        if (!note) {
            return null;
        }
        note.deletedAt = new Date('2026-05-12T08:06:00Z');
        return note;
    }

    async restoreNote(id: string): Promise<DailyNoteEntity | null> {
        const note = this.notes.find((item) => item.id === id) ?? null;
        if (!note) {
            return null;
        }
        note.deletedAt = null;
        return note;
    }

    async upsertPresence(boardId: string, pseudo: string, editingSectionId?: string | null): Promise<DailyPresenceEntity> {
        const presence: DailyPresenceEntity = {
            id: `presence-${pseudo}`,
            boardId,
            pseudo,
            lastSeenAt: new Date(),
            editingSectionId: editingSectionId ?? null,
        };
        this.presence = [presence];
        return presence;
    }

    async listPresence(_boardId: string, _activeSince: Date): Promise<DailyPresenceEntity[]> {
        return this.presence;
    }

    async listHistory(_from?: string, _to?: string, _filter?: DailyHistoryFilter): Promise<DailyHistoryEntry[]> {
        return [{ board: this.board, notes: this.notes.filter((note) => note.deletedAt === null) }];
    }
}

test('createNote trims title and sets blocker metadata', async () => {
    const repository = new FakeDailyBoardRepository();
    const service = new DailyBoardService(repository);

    const note = await service.createNote('2026-05-12', {
        ownerPseudo: 'Alice',
        authorPseudo: 'Alice',
        column: DailyNoteColumn.BLOCKED,
        title: '  Incident prod  ',
    });

    assert.equal(note.title, 'Incident prod');
    assert.equal(note.column, DailyNoteColumn.BLOCKED);
    assert.ok(note.blockedSince instanceof Date);
});

test('updateNote switches done flag when moved to done yesterday', async () => {
    const repository = new FakeDailyBoardRepository();
    const service = new DailyBoardService(repository);
    const note = await repository.createNote(repository.board.id, {
        ownerPseudo: 'Alice',
        authorPseudo: 'Alice',
        column: DailyNoteColumn.TODO,
        title: 'Préparer release',
    });

    const updated = await service.updateNote(note.id, {
        column: DailyNoteColumn.DONE,
    });

    assert.equal(updated.column, DailyNoteColumn.DONE);
    assert.equal(updated.done, true);
    assert.ok(updated.doneAt instanceof Date);
});

test('deleteNote and restoreNote keep soft delete semantics', async () => {
    const repository = new FakeDailyBoardRepository();
    const service = new DailyBoardService(repository);
    const note = await repository.createNote(repository.board.id, {
        ownerPseudo: 'Alice',
        authorPseudo: 'Bob',
        column: DailyNoteColumn.DOING,
        title: 'Refonte API',
    });

    const deleted = await service.deleteNote(note.id);
    assert.ok(deleted.deletedAt instanceof Date);

    const restored = await service.restoreNote(note.id);
    assert.equal(restored.deletedAt, null);
});
