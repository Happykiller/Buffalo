import { InputType, Field } from '@nestjs/graphql';
import { Criticality } from '../../domain/criticality.enum';

@InputType()
export class CreateRequestInput {
    @Field()
    userDisplayName!: string;

    @Field(() => String, { nullable: true })
    message!: string | null;

    @Field(() => Criticality)
    criticality!: Criticality;

    @Field()
    themeKey!: string;
}
