import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PubSub } from 'graphql-subscriptions';
import { DailyBoardService } from './application/daily-board.service';
import { DAILY_BOARD_REPOSITORY } from './domain/daily-board.repository.port';
import { DailyBoardDocument, DailyBoardSchema } from './infrastructure/daily-board.schema';
import { DailyNoteDocument, DailyNoteSchema } from './infrastructure/daily-note.schema';
import { DailyPresenceDocument, DailyPresenceSchema } from './infrastructure/daily-presence.schema';
import { DailyBoardRepositoryAdapter } from './infrastructure/daily-board.repository.adapter';
import { DailyBoardResolver } from './interfaces/graphql/daily-board.resolver';
import { DAILY_BOARD_PUB_SUB } from './interfaces/graphql/daily-board-events';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: DailyBoardDocument.name, schema: DailyBoardSchema },
            { name: DailyNoteDocument.name, schema: DailyNoteSchema },
            { name: DailyPresenceDocument.name, schema: DailyPresenceSchema },
        ]),
    ],
    providers: [
        { provide: DAILY_BOARD_REPOSITORY, useClass: DailyBoardRepositoryAdapter },
        { provide: DAILY_BOARD_PUB_SUB, useFactory: () => new PubSub() },
        DailyBoardService,
        DailyBoardResolver,
    ],
})
export class DailyBoardModule { }
