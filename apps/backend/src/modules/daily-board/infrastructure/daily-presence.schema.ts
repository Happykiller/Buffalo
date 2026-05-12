import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'dailyPresence', timestamps: false })
export class DailyPresenceDocument extends Document {
    @Prop({ required: true, index: true })
    boardId!: string;

    @Prop({ required: true, index: true })
    pseudo!: string;

    @Prop({ type: Date, required: true, default: () => new Date() })
    lastSeenAt!: Date;

    @Prop({ type: String, default: null })
    editingSectionId!: string | null;
}

export const DailyPresenceSchema = SchemaFactory.createForClass(DailyPresenceDocument);
DailyPresenceSchema.index({ boardId: 1, pseudo: 1 }, { unique: true });
