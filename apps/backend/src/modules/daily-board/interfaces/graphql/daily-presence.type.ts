import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DailyPresenceType {
    @Field()
    id!: string;

    @Field()
    boardId!: string;

    @Field()
    pseudo!: string;

    @Field(() => Date)
    lastSeenAt!: Date;

    @Field(() => String, { nullable: true })
    editingSectionId!: string | null;
}
