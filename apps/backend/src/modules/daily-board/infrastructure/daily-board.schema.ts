import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'dailyBoards', timestamps: false })
export class DailyBoardDocument extends Document {
    @Prop({ required: true, unique: true, index: true })
    date!: string;

    @Prop({ required: true, default: '' })
    focus!: string;

    @Prop({ required: true, default: () => new Date() })
    createdAt!: Date;

    @Prop({ required: true, default: () => new Date() })
    updatedAt!: Date;
}

export const DailyBoardSchema = SchemaFactory.createForClass(DailyBoardDocument);
