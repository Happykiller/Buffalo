import { ObjectType, Field, Int } from '@nestjs/graphql';
import { RequestType } from './request.type';

@ObjectType('RequestPage')
export class RequestPageType {
    @Field(() => [RequestType])
    items!: RequestType[];

    @Field(() => Int)
    total!: number;

    @Field(() => Int)
    page!: number;

    @Field(() => Int)
    pageSize!: number;

    @Field(() => Int)
    totalPages!: number;
}
