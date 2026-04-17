import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class RequesterStatType {
    @Field()
    userDisplayName!: string;

    @Field(() => Int)
    totalCount!: number;

    @Field(() => Int)
    openCount!: number;

    @Field(() => Int)
    doneCount!: number;

    @Field(() => Int)
    urgentCount!: number;
}
