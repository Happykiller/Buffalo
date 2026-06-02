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

function toDateString(date: Date): string {
    const y = date.getUTCFullYear();
    const m = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const d = `${date.getUTCDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
}

class FakeDailyBoardRepository implements DailyBoardRepositoryPort {
    boards = new Map<string, DailyBoardEntity>([
        ['2026-05-12', {
            id: 'board-1',
            date: '2026-05-12',
            focus: '',
            createdAt: new Date('2026-05-12T08:00:00Z'),
            updatedAt: new Date('2026-05-12T08:00:00Z'),
        }],
    ]);

    notes: DailyNoteEntity[] = [];
    presence: DailyPresenceEntity[] = [];
    sequence = 0;

    async getOrCreateBoard(date: string): Promise<DailyBoardEntity> {
        const existing = this.boards.get(date);
        if (existing) {
            return existing;
        }
        const nextBoard: DailyBoardEntity = {
            id: `board-${this.boards.size + 1}`,
            date,
            focus: '',
            createdAt: new Date('2026-05-12T08:00:00Z'),
            updatedAt: new Date('2026-05-12T08:00:00Z'),
        };
        this.boards.set(date, nextBoard);
        return nextBoard;
    }

    async updateBoardFocus(date: string, focus: string): Promise<DailyBoardEntity> {
        const board = await this.getOrCreateBoard(date);
        board.focus = focus;
        board.updatedAt = new Date('2026-05-12T08:10:00Z');
        return board;
    }

    async listNotes(date: string): Promise<DailyNoteEntity[]> {
        return this.notes.filter((note) => {
            if (note.deletedAt !== null) return false;
            if (note.column === 'DONE') {
                return note.doneAt !== null && toDateString(note.doneAt) === date;
            }
            return true;
        });
    }

    async listRecentlyDoneNotes(beforeDate: string, daysBack: number): Promise<DailyNoteEntity[]> {
        const before = new Date(`${beforeDate}T00:00:00.000Z`);
        const after = new Date(before);
        after.setDate(after.getDate() - daysBack);
        return this.notes
            .filter(
                (note) =>
                    note.deletedAt === null &&
                    note.column === 'DONE' &&
                    note.doneAt !== null &&
                    note.doneAt >= after &&
                    note.doneAt < before,
            )
            .sort((a, b) => b.doneAt!.getTime() - a.doneAt!.getTime());
    }

    async findNoteById(id: string): Promise<DailyNoteEntity | null> {
        return this.notes.find((note) => note.id === id) ?? null;
    }

    async createNote(data: CreateDailyNoteData): Promise<DailyNoteEntity> {
        const now = data.createdAt ?? new Date('2026-05-12T08:00:00Z');
        const note: DailyNoteEntity = {
            id: `note-${++this.sequence}`,
            authorPseudo: data.authorPseudo,
            column: data.column,
            title: data.title,
            description: data.description ?? null,
            label: data.label ?? null,
            url: data.url ?? null,
            done: data.column === DailyNoteColumn.DONE,
            blockedSince: data.column === DailyNoteColumn.BLOCKED ? data.blockedSince ?? new Date('2026-05-12T08:00:00Z') : null,
            doingSince: data.column === DailyNoteColumn.DOING ? now : null,
            doneAt: data.column === DailyNoteColumn.DONE ? data.doneAt ?? new Date('2026-05-12T08:00:00Z') : null,
            helpNeeded: data.helpNeeded ?? null,
            unblockAssignedTo: data.unblockAssignedTo ?? null,
            deletedAt: null,
            createdAt: now,
            updatedAt: now,
        };
        this.notes.push(note);
        return note;
    }

    async updateNote(id: string, patch: UpdateDailyNoteData): Promise<DailyNoteEntity | null> {
        const note = this.notes.find((item) => item.id === id) ?? null;
        if (!note) return null;
        Object.assign(note, patch);
        note.updatedAt = new Date('2026-05-12T08:05:00Z');
        return note;
    }

    async softDeleteNote(id: string): Promise<DailyNoteEntity | null> {
        const note = this.notes.find((item) => item.id === id) ?? null;
        if (!note) return null;
        note.deletedAt = new Date('2026-05-12T08:06:00Z');
        return note;
    }

    async restoreNote(id: string): Promise<DailyNoteEntity | null> {
        const note = this.notes.find((item) => item.id === id) ?? null;
        if (!note) return null;
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
        return [...this.boards.values()]
            .filter((board) => (!_from || board.date >= _from) && (!_to || board.date <= _to))
            .map((board) => ({
                board,
                notes: this.notes.filter((note) => {
                    if (note.deletedAt !== null) return false;
                    const eventDate =
                        note.column === 'DONE' && note.doneAt
                            ? toDateString(note.doneAt)
                            : toDateString(note.createdAt);
                    return eventDate === board.date;
                }),
            }));
    }
}

test('createNote trims title and sets blocker metadata', async () => {
    const repository = new FakeDailyBoardRepository();
    const service = new DailyBoardService(repository);

    const note = await service.createNote('2026-05-12', {
        authorPseudo: 'Alice',
        column: DailyNoteColumn.BLOCKED,
        title: '  Incident prod  ',
    });

    assert.equal(note.title, 'Incident prod');
    assert.equal(note.column, DailyNoteColumn.BLOCKED);
    assert.ok(note.blockedSince instanceof Date);
});

test('updateNote switches done flag when moved to DONE', async () => {
    const repository = new FakeDailyBoardRepository();
    const service = new DailyBoardService(repository);
    const note = await repository.createNote({
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
    const note = await repository.createNote({
        authorPseudo: 'Alice',
        column: DailyNoteColumn.DOING,
        title: 'Refonte API',
    });

    const deleted = await service.deleteNote(note.id);
    assert.ok(deleted.deletedAt instanceof Date);

    const restored = await service.restoreNote(note.id);
    assert.equal(restored.deletedAt, null);
});

test('getBoard shows active notes for any date and yesterday done notes', async () => {
    const repository = new FakeDailyBoardRepository();
    const service = new DailyBoardService(repository);

    await repository.createNote({
        authorPseudo: 'Alice',
        column: DailyNoteColumn.TODO,
        title: 'Préparer release',
        createdAt: new Date('2026-05-12T08:00:00Z'),
    });
    await repository.createNote({
        authorPseudo: 'Alice',
        column: DailyNoteColumn.DOING,
        title: 'Refonte API',
        createdAt: new Date('2026-05-12T08:00:00Z'),
    });
    await repository.createNote({
        authorPseudo: 'Alice',
        column: DailyNoteColumn.BLOCKED,
        title: 'Attendre validation',
        blockedSince: new Date('2026-05-12T08:00:00Z'),
        createdAt: new Date('2026-05-12T08:00:00Z'),
    });
    await repository.createNote({
        authorPseudo: 'Alice',
        column: DailyNoteColumn.DONE,
        title: 'Fix auth',
        doneAt: new Date('2026-05-12T08:00:00Z'),
        createdAt: new Date('2026-05-12T08:00:00Z'),
    });

    const board = await service.getBoard('2026-05-13', 'Alice');
    const alice = board.people.find((person) => person.pseudo === 'Alice');

    assert.ok(alice);
    assert.deepEqual(alice.todo.map((note) => note.title), ['Préparer release']);
    assert.deepEqual(alice.doing.map((note) => note.title), ['Refonte API']);
    assert.deepEqual(alice.blocked.map((note) => note.title), ['Attendre validation']);
    assert.deepEqual(alice.done.map((note) => note.title), []);
    assert.deepEqual(alice.donePreviously.map((note) => note.title), ['Fix auth']);
});

test('getBoard reflects column change immediately', async () => {
    const repository = new FakeDailyBoardRepository();
    const service = new DailyBoardService(repository);

    await repository.createNote({
        authorPseudo: 'Alice',
        column: DailyNoteColumn.TODO,
        title: 'Préparer release',
    });

    const firstLoad = await service.getBoard('2026-05-13', 'Alice');
    const note = firstLoad.people.find((person) => person.pseudo === 'Alice')?.todo[0];
    assert.ok(note);

    await service.updateNote(note.id, { column: DailyNoteColumn.DOING });

    const secondLoad = await service.getBoard('2026-05-13', 'Alice');
    const alice = secondLoad.people.find((person) => person.pseudo === 'Alice');

    assert.ok(alice);
    assert.deepEqual(alice.todo.map((n) => n.title), []);
    assert.deepEqual(alice.doing.map((n) => n.title), ['Préparer release']);
});

test('deleted note does not reappear on next board load', async () => {
    const repository = new FakeDailyBoardRepository();
    const service = new DailyBoardService(repository);

    await repository.createNote({
        authorPseudo: 'Alice',
        column: DailyNoteColumn.TODO,
        title: 'Préparer release',
    });

    const firstLoad = await service.getBoard('2026-05-13', 'Alice');
    const note = firstLoad.people.find((person) => person.pseudo === 'Alice')?.todo[0];
    assert.ok(note);

    await service.deleteNote(note.id);

    const secondLoad = await service.getBoard('2026-05-13', 'Alice');
    const alice = secondLoad.people.find((person) => person.pseudo === 'Alice');

    assert.ok(alice);
    assert.deepEqual(alice.todo.map((n) => n.title), []);
});
