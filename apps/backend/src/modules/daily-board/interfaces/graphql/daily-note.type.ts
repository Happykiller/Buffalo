import { Field, ObjectType } from '@nestjs/graphql';
import { DailyNoteColumn } from './daily-note-column.enum';

@ObjectType()
export class DailyNoteType {
    @Field()
    id!: string;

    @Field()
    boardId!: string;

    @Field()
    ownerPseudo!: string;

    @Field()
    authorPseudo!: string;

    @Field(() => DailyNoteColumn)
    column!: DailyNoteColumn;

    @Field()
    title!: string;

    @Field(() => String, { nullable: true })
    description!: string | null;

    @Field(() => String, { nullable: true })
    label!: string | null;

    @Field(() => String, { nullable: true })
    url!: string | null;

    @Field()
    done!: boolean;

    @Field(() => Date, { nullable: true })
    blockedSince!: Date | null;

    @Field(() => Date, { nullable: true })
    doneAt!: Date | null;

    @Field(() => String, { nullable: true })
    helpNeeded!: string | null;

    @Field(() => String, { nullable: true })
    unblockAssignedTo!: string | null;

    @Field(() => Date, { nullable: true })
    deletedAt!: Date | null;

    @Field(() => Date)
    createdAt!: Date;

    @Field(() => Date)
    updatedAt!: Date;
}
