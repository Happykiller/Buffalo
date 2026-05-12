import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
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
import { DailyNoteDocument } from './daily-note.schema';
import { DailyBoardDocument } from './daily-board.schema';
import { DailyPresenceDocument } from './daily-presence.schema';

@Injectable()
export class DailyBoardRepositoryAdapter implements DailyBoardRepositoryPort {
    constructor(
        @InjectModel(DailyBoardDocument.name)
        private readonly boardModel: Model<DailyBoardDocument>,
        @InjectModel(DailyNoteDocument.name)
        private readonly noteModel: Model<DailyNoteDocument>,
        @InjectModel(DailyPresenceDocument.name)
        private readonly presenceModel: Model<DailyPresenceDocument>,
    ) { }

    async getOrCreateBoard(date: string): Promise<DailyBoardEntity> {
        const doc = await this.boardModel
            .findOneAndUpdate(
                { date },
                { $setOnInsert: { date, focus: '', createdAt: new Date(), updatedAt: new Date() } },
                { new: true, upsert: true },
            )
            .exec();

        return this.toBoardEntity(doc);
    }

    async updateBoardFocus(date: string, focus: string): Promise<DailyBoardEntity> {
        const doc = await this.boardModel
            .findOneAndUpdate(
                { date },
                {
                    $set: {
                        focus,
                        updatedAt: new Date(),
                    },
                    $setOnInsert: {
                        date,
                        createdAt: new Date(),
                    },
                },
                { new: true, upsert: true },
            )
            .exec();

        return this.toBoardEntity(doc);
    }

    async listNotes(boardId: string, includeDeleted = false): Promise<DailyNoteEntity[]> {
        const query: FilterQuery<DailyNoteDocument> = { boardId };
        if (!includeDeleted) {
            query.deletedAt = null;
        }

        const docs = await this.noteModel.find(query).sort({ ownerPseudo: 1, createdAt: 1 }).exec();
        return docs.map((doc) => this.toNoteEntity(doc));
    }

    async findNoteById(id: string): Promise<DailyNoteEntity | null> {
        const doc = await this.noteModel.findById(id).exec();
        return doc ? this.toNoteEntity(doc) : null;
    }

    async createNote(boardId: string, data: CreateDailyNoteData): Promise<DailyNoteEntity> {
        const now = data.createdAt ?? new Date();
        const doc = await this.noteModel.create({
            boardId,
            ownerPseudo: data.ownerPseudo,
            authorPseudo: data.authorPseudo,
            column: data.column,
            title: data.title,
            description: data.description ?? null,
            label: data.label ?? null,
            url: data.url ?? null,
            done: data.column === 'DONE',
            blockedSince: data.column === 'BLOCKED' ? data.blockedSince ?? now : null,
            doneAt: data.column === 'DONE' ? data.doneAt ?? now : null,
            helpNeeded: data.helpNeeded ?? null,
            unblockAssignedTo: data.unblockAssignedTo ?? null,
            deletedAt: null,
            createdAt: now,
            updatedAt: now,
        });
        return this.toNoteEntity(doc);
    }

    async updateNote(id: string, patch: UpdateDailyNoteData): Promise<DailyNoteEntity | null> {
        const update: Record<string, unknown> = {
            updatedAt: new Date(),
        };

        for (const [key, value] of Object.entries(patch)) {
            update[key] = value;
        }

        if (patch.column && patch.done === undefined) {
            update.done = patch.column === 'DONE';
        }
        if (patch.column) {
            update.blockedSince = patch.column === 'BLOCKED' ? patch.blockedSince ?? new Date() : null;
            update.doneAt = patch.column === 'DONE' ? patch.doneAt ?? new Date() : null;
        }

        const doc = await this.noteModel.findByIdAndUpdate(id, update, { new: true }).exec();
        return doc ? this.toNoteEntity(doc) : null;
    }

    async softDeleteNote(id: string): Promise<DailyNoteEntity | null> {
        const doc = await this.noteModel
            .findByIdAndUpdate(id, { deletedAt: new Date(), updatedAt: new Date() }, { new: true })
            .exec();
        return doc ? this.toNoteEntity(doc) : null;
    }

    async restoreNote(id: string): Promise<DailyNoteEntity | null> {
        const doc = await this.noteModel
            .findByIdAndUpdate(id, { deletedAt: null, updatedAt: new Date() }, { new: true })
            .exec();
        return doc ? this.toNoteEntity(doc) : null;
    }

    async upsertPresence(
        boardId: string,
        pseudo: string,
        editingSectionId?: string | null,
    ): Promise<DailyPresenceEntity> {
        const doc = await this.presenceModel
            .findOneAndUpdate(
                { boardId, pseudo },
                {
                    $set: {
                        lastSeenAt: new Date(),
                        editingSectionId: editingSectionId ?? null,
                    },
                },
                { new: true, upsert: true, setDefaultsOnInsert: true },
            )
            .exec();
        return this.toPresenceEntity(doc);
    }

    async listPresence(boardId: string, activeSince: Date): Promise<DailyPresenceEntity[]> {
        const docs = await this.presenceModel
            .find({ boardId, lastSeenAt: { $gte: activeSince } })
            .sort({ pseudo: 1 })
            .exec();
        return docs.map((doc) => this.toPresenceEntity(doc));
    }

    async listHistory(from?: string, to?: string, filter = DailyHistoryFilter.ALL): Promise<DailyHistoryEntry[]> {
        const boardQuery: FilterQuery<DailyBoardDocument> = {};
        if (from || to) {
            boardQuery.date = {};
            if (from) {
                (boardQuery.date as Record<string, string>).$gte = from;
            }
            if (to) {
                (boardQuery.date as Record<string, string>).$lte = to;
            }
        }

        const boards = await this.boardModel.find(boardQuery).sort({ date: -1 }).exec();
        if (boards.length === 0) {
            return [];
        }

        const boardIds = boards.map((board) => board._id.toString());
        const notes = await this.noteModel
            .find({ boardId: { $in: boardIds }, deletedAt: null })
            .sort({ createdAt: -1 })
            .exec();

        const filteredNotes = notes.filter((note) => this.matchesHistoryFilter(this.toNoteEntity(note), filter));
        const notesByBoardId = new Map<string, DailyNoteEntity[]>();
        for (const note of filteredNotes) {
            const boardNotes = notesByBoardId.get(note.boardId) ?? [];
            boardNotes.push(this.toNoteEntity(note));
            notesByBoardId.set(note.boardId, boardNotes);
        }

        return boards
            .map((board) => ({
                board: this.toBoardEntity(board),
                notes: notesByBoardId.get(board._id.toString()) ?? [],
            }))
            .filter((entry) => entry.board.focus || entry.notes.length > 0);
    }

    private matchesHistoryFilter(note: DailyNoteEntity, filter: DailyHistoryFilter) {
        switch (filter) {
            case DailyHistoryFilter.DONE:
                return note.done || note.column === 'DONE';
            case DailyHistoryFilter.BLOCKERS:
                return note.column === 'BLOCKED';
            case DailyHistoryFilter.DECISIONS:
                return /decision|report/i.test(note.label ?? '') || /decision|report/i.test(note.title);
            case DailyHistoryFilter.ALL:
            default:
                return true;
        }
    }

    private toBoardEntity(doc: DailyBoardDocument): DailyBoardEntity {
        return {
            id: doc._id.toString(),
            date: doc.date,
            focus: doc.focus,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
    }

    private toNoteEntity(doc: DailyNoteDocument): DailyNoteEntity {
        return {
            id: doc._id.toString(),
            boardId: doc.boardId,
            ownerPseudo: doc.ownerPseudo,
            authorPseudo: doc.authorPseudo,
            column: doc.column as DailyNoteEntity['column'],
            title: doc.title,
            description: doc.description,
            label: doc.label,
            url: doc.url,
            done: doc.done,
            blockedSince: doc.blockedSince,
            doneAt: doc.doneAt,
            helpNeeded: doc.helpNeeded,
            unblockAssignedTo: doc.unblockAssignedTo,
            deletedAt: doc.deletedAt,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
    }

    private toPresenceEntity(doc: DailyPresenceDocument): DailyPresenceEntity {
        return {
            id: doc._id.toString(),
            boardId: doc.boardId,
            pseudo: doc.pseudo,
            lastSeenAt: doc.lastSeenAt,
            editingSectionId: doc.editingSectionId,
        };
    }
}
