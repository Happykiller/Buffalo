import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { DailyNoteType } from './daily-note.type';

export enum DailyPersonStatus {
    ONLINE = 'ONLINE',
    ABSENT = 'ABSENT',
    EDITING = 'EDITING',
}

registerEnumType(DailyPersonStatus, {
    name: 'DailyPersonStatus',
});

@ObjectType()
export class DailyPersonSectionType {
    @Field()
    pseudo!: string;

    @Field(() => DailyPersonStatus)
    status!: DailyPersonStatus;

    @Field(() => [DailyNoteType])
    doneYesterday!: DailyNoteType[];

    @Field(() => [DailyNoteType])
    todo!: DailyNoteType[];

    @Field(() => [DailyNoteType])
    doing!: DailyNoteType[];

    @Field(() => [DailyNoteType])
    blocked!: DailyNoteType[];

    @Field(() => [DailyNoteType])
    done!: DailyNoteType[];
}
