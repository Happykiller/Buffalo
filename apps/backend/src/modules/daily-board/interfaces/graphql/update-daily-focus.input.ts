import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateDailyFocusInput {
    @Field(() => String, { nullable: true })
    boardDate?: string;

    @Field()
    focus!: string;
}
