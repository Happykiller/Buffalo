import { Field, ObjectType } from '@nestjs/graphql';
import { DailyNoteType } from './daily-note.type';
import { DailyPersonSectionType } from './daily-person-section.type';
import { DailyPresenceType } from './daily-presence.type';

@ObjectType()
export class DailyBoardType {
    @Field()
    id!: string;

    @Field()
    date!: string;

    @Field()
    focus!: string;

    @Field(() => Date)
    createdAt!: Date;

    @Field(() => Date)
    updatedAt!: Date;
}

@ObjectType()
export class DailyBoardViewType {
    @Field(() => DailyBoardType)
    board!: DailyBoardType;

    @Field(() => [DailyNoteType])
    blockers!: DailyNoteType[];

    @Field(() => [DailyPersonSectionType])
    people!: DailyPersonSectionType[];

    @Field(() => [DailyPresenceType])
    presence!: DailyPresenceType[];

    @Field(() => [String])
    labels!: string[];

    @Field(() => [DailyNoteType])
    notes!: DailyNoteType[];

    @Field()
    connectedCount!: number;

    @Field(() => Date)
    savedAt!: Date;
}
