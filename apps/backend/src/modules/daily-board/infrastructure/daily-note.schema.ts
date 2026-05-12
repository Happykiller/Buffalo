import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'dailyNotes', timestamps: false })
export class DailyNoteDocument extends Document {
    @Prop({ required: true, index: true })
    boardId!: string;

    @Prop({ required: true, index: true })
    ownerPseudo!: string;

    @Prop({ required: true })
    authorPseudo!: string;

    @Prop({ required: true, index: true })
    column!: string;

    @Prop({ required: true })
    title!: string;

    @Prop({ type: String, default: null })
    description!: string | null;

    @Prop({ type: String, default: null })
    label!: string | null;

    @Prop({ type: String, default: null })
    url!: string | null;

    @Prop({ required: true, default: false })
    done!: boolean;

    @Prop({ type: Date, default: null })
    blockedSince!: Date | null;

    @Prop({ type: Date, default: null })
    doneAt!: Date | null;

    @Prop({ type: String, default: null })
    helpNeeded!: string | null;

    @Prop({ type: String, default: null })
    unblockAssignedTo!: string | null;

    @Prop({ type: Date, default: null, index: true })
    deletedAt!: Date | null;

    @Prop({ required: true, default: () => new Date() })
    createdAt!: Date;

    @Prop({ required: true, default: () => new Date() })
    updatedAt!: Date;
}

export const DailyNoteSchema = SchemaFactory.createForClass(DailyNoteDocument);
