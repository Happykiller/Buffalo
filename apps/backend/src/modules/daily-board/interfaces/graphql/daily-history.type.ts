import { Field, ObjectType } from '@nestjs/graphql';
import { DailyNoteColumn } from './daily-note-column.enum';
import { DailyBoardType } from './daily-board.type';

@ObjectType()
export class DailyHistoryEventType {
    @Field()
    id!: string;

    @Field()
    pseudo!: string;

    @Field(() => String)
    kind!: string;

    @Field()
    title!: string;

    @Field(() => String, { nullable: true })
    label!: string | null;

    @Field(() => DailyNoteColumn)
    column!: DailyNoteColumn;

    @Field(() => Date)
    createdAt!: Date;
}

@ObjectType()
export class DailyHistoryPersonGroupType {
    @Field()
    pseudo!: string;

    @Field(() => [DailyHistoryEventType])
    items!: DailyHistoryEventType[];
}

@ObjectType()
export class DailyHistoryDayGroupType {
    @Field(() => DailyBoardType)
    board!: DailyBoardType;

    @Field()
    focus!: string;

    @Field(() => [DailyHistoryEventType])
    events!: DailyHistoryEventType[];

    @Field(() => [DailyHistoryPersonGroupType])
    people!: DailyHistoryPersonGroupType[];
}
