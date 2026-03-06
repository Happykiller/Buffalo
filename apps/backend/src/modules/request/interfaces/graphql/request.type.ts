import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Criticality } from '../../domain/criticality.enum';
import { RequestStatus } from '../../domain/request-status.enum';

@ObjectType('Request')
export class RequestType {
    @Field(() => ID)
    id!: string;

    @Field()
    userDisplayName!: string;

    @Field(() => Int, { nullable: true })
    requestNumber!: number | null;

    @Field(() => String, { nullable: true })
    message!: string | null;

    @Field(() => Criticality)
    criticality!: Criticality;

    @Field(() => RequestStatus)
    status!: RequestStatus;

    @Field()
    themeKey!: string;

    @Field()
    createdAt!: Date;

    @Field(() => Date, { nullable: true })
    processedAt!: Date | null;
}
