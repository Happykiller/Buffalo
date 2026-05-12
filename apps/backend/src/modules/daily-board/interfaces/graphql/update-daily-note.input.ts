import { Field, InputType } from '@nestjs/graphql';
import { DailyNoteColumn } from './daily-note-column.enum';

@InputType()
export class UpdateDailyNoteInput {
    @Field(() => String, { nullable: true })
    ownerPseudo?: string;

    @Field(() => DailyNoteColumn, { nullable: true })
    column?: DailyNoteColumn;

    @Field(() => String, { nullable: true })
    title?: string;

    @Field(() => String, { nullable: true })
    description?: string;

    @Field(() => String, { nullable: true })
    label?: string;

    @Field(() => String, { nullable: true })
    url?: string;

    @Field({ nullable: true })
    done?: boolean;

    @Field(() => String, { nullable: true })
    helpNeeded?: string;

    @Field(() => String, { nullable: true })
    unblockAssignedTo?: string;
}
