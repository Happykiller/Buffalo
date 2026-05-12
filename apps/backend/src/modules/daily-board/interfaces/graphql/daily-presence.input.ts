import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class DailyPresenceInput {
    @Field(() => String, { nullable: true })
    boardDate?: string;

    @Field()
    pseudo!: string;

    @Field(() => String, { nullable: true })
    editingSectionId?: string;
}
