import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { DailyBoardService } from '../../application/daily-board.service';
import { DailyHistoryFilter } from './daily-history-filter.enum';
import { DailyHistoryGroupBy } from './daily-history-group-by.enum';
import { CreateDailyNoteInput } from './create-daily-note.input';
import { DailyPresenceInput } from './daily-presence.input';
import { UpdateDailyFocusInput } from './update-daily-focus.input';
import { UpdateDailyNoteInput } from './update-daily-note.input';
import { DailyBoardEventType } from './daily-board-event.type';
import { DailyBoardViewType } from './daily-board.type';
import { DailyHistoryDayGroupType } from './daily-history.type';
import { DailyNoteType } from './daily-note.type';
import { DailyPresenceType } from './daily-presence.type';
import {
    DAILY_BOARD_PUB_SUB,
    DAILY_BOARD_UPDATED_EVENT,
    DAILY_PRESENCE_CHANGED_EVENT,
} from './daily-board-events';

@Resolver()
export class DailyBoardResolver {
    constructor(
        private readonly dailyBoardService: DailyBoardService,
        @Inject(DAILY_BOARD_PUB_SUB) private readonly pubSub: PubSub,
    ) { }

    @Query(() => DailyBoardViewType)
    async dailyBoard(
        @Args('date', { nullable: true }) date?: string,
        @Args('currentPseudo', { nullable: true }) currentPseudo?: string,
    ) {
        return this.dailyBoardService.getBoard(date, currentPseudo);
    }

    @Query(() => [DailyHistoryDayGroupType])
    async dailyHistory(
        @Args('from', { nullable: true }) from?: string,
        @Args('to', { nullable: true }) to?: string,
        @Args('groupBy', { type: () => DailyHistoryGroupBy, nullable: true }) groupBy?: DailyHistoryGroupBy,
        @Args('filter', { type: () => DailyHistoryFilter, nullable: true }) filter?: DailyHistoryFilter,
    ) {
        return this.dailyBoardService.getHistory(from, to, groupBy, filter);
    }

    @Mutation(() => DailyNoteType)
    async createDailyNote(@Args('input') input: CreateDailyNoteInput) {
        const note = await this.dailyBoardService.createNote(input.boardDate, input);
        await this.publishBoardUpdate(input.boardDate ?? null, 'note.created', input.authorPseudo, note.id);
        return note;
    }

    @Mutation(() => DailyNoteType)
    async updateDailyNote(
        @Args('noteId') noteId: string,
        @Args('input') input: UpdateDailyNoteInput,
    ) {
        const note = await this.dailyBoardService.updateNote(noteId, input);
        await this.publishBoardUpdate(null, 'note.updated', note.authorPseudo, note.id);
        return note;
    }

    @Mutation(() => DailyNoteType)
    async deleteDailyNote(@Args('noteId') noteId: string) {
        const note = await this.dailyBoardService.deleteNote(noteId);
        await this.publishBoardUpdate(null, 'note.deleted', note.authorPseudo, note.id);
        return note;
    }

    @Mutation(() => DailyNoteType)
    async restoreDailyNote(@Args('noteId') noteId: string) {
        const note = await this.dailyBoardService.restoreNote(noteId);
        await this.publishBoardUpdate(null, 'note.restored', note.authorPseudo, note.id);
        return note;
    }

    @Mutation(() => DailyPresenceType)
    async heartbeatDailyPresence(@Args('input') input: DailyPresenceInput) {
        const presence = await this.dailyBoardService.heartbeatPresence(
            input.boardDate,
            input.pseudo,
            input.editingSectionId,
        );
        await this.publishPresenceChange(input.boardDate ?? null, input.pseudo);
        return presence;
    }

    @Mutation(() => DailyNoteType)
    async markBlockerResolved(@Args('noteId') noteId: string) {
        const note = await this.dailyBoardService.updateNote(noteId, {
            column: undefined,
            helpNeeded: null,
            unblockAssignedTo: null,
            done: false,
        });
        await this.publishBoardUpdate(null, 'blocker.resolved', note.authorPseudo, note.id);
        return note;
    }

    @Mutation(() => String)
    async updateDailyFocus(@Args('input') input: UpdateDailyFocusInput) {
        const board = await this.dailyBoardService.updateFocus(input.boardDate, input.focus);
        await this.publishBoardUpdate(board.date, 'focus.updated', null, null);
        return board.focus;
    }

    @Subscription(() => DailyBoardEventType, {
        filter: (payload, variables) => payload.dailyBoardUpdated.boardDate === variables.boardDate,
    })
    dailyBoardUpdated(@Args('boardDate') _boardDate: string) {
        return this.pubSub.asyncIterableIterator(DAILY_BOARD_UPDATED_EVENT);
    }

    @Subscription(() => DailyBoardEventType, {
        filter: (payload, variables) => payload.dailyPresenceChanged.boardDate === variables.boardDate,
    })
    dailyPresenceChanged(@Args('boardDate') _boardDate: string) {
        return this.pubSub.asyncIterableIterator(DAILY_PRESENCE_CHANGED_EVENT);
    }

    private async publishBoardUpdate(
        boardDate: string | null,
        kind: string,
        pseudo: string | null,
        noteId: string | null,
    ) {
        await this.pubSub.publish(DAILY_BOARD_UPDATED_EVENT, {
            dailyBoardUpdated: {
                boardDate: boardDate ?? currentLocalBoardDate(),
                kind,
                pseudo,
                noteId,
                occurredAt: new Date(),
            },
        });
    }

    private async publishPresenceChange(boardDate: string | null, pseudo: string) {
        await this.pubSub.publish(DAILY_PRESENCE_CHANGED_EVENT, {
            dailyPresenceChanged: {
                boardDate: boardDate ?? currentLocalBoardDate(),
                kind: 'presence.changed',
                pseudo,
                noteId: null,
                occurredAt: new Date(),
            },
        });
    }
}

function currentLocalBoardDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}
