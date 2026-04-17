import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { RequesterStatType } from './requester-stat.type';

@ObjectType()
export class RequestStatsType {
    @Field(() => Int)
    totalRequests!: number;

    @Field(() => Int)
    openRequests!: number;

    @Field(() => Int)
    doneRequests!: number;

    @Field(() => Int)
    byLow!: number;

    @Field(() => Int)
    byMedium!: number;

    @Field(() => Int)
    byHigh!: number;

    @Field(() => Int)
    byUrgent!: number;

    @Field(() => Float, { nullable: true })
    avgProcessingTimeMs!: number | null;

    @Field(() => [RequesterStatType])
    topRequesters!: RequesterStatType[];

    @Field(() => Int)
    totalRequesters!: number;
}
