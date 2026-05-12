import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DailyBoardEventType {
    @Field()
    boardDate!: string;

    @Field(() => String)
    kind!: string;

    @Field(() => String, { nullable: true })
    pseudo!: string | null;

    @Field(() => String, { nullable: true })
    noteId!: string | null;

    @Field(() => Date)
    occurredAt!: Date;
}
