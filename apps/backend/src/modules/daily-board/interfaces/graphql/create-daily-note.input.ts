import { Field, InputType } from '@nestjs/graphql';
import { DailyNoteColumn } from './daily-note-column.enum';

@InputType()
export class CreateDailyNoteInput {
    @Field(() => String, { nullable: true })
    boardDate?: string;

    @Field()
    authorPseudo!: string;

    @Field(() => DailyNoteColumn)
    column!: DailyNoteColumn;

    @Field()
    title!: string;

    @Field(() => Date, { nullable: true })
    createdAt?: Date;

    @Field(() => Date, { nullable: true })
    doneAt?: Date;

    @Field(() => String, { nullable: true })
    description?: string;

    @Field(() => String, { nullable: true })
    label?: string;

    @Field(() => String, { nullable: true })
    url?: string;

    @Field(() => String, { nullable: true })
    helpNeeded?: string;

    @Field(() => String, { nullable: true })
    unblockAssignedTo?: string;
}
