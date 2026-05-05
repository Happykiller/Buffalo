import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'requests', timestamps: false })
export class RequestDocument extends Document {
    @Prop({ required: true })
    userDisplayName!: string;

    @Prop({ type: Number, required: false, unique: true, sparse: true, index: true })
    requestNumber!: number | null;

    @Prop({ type: String, required: false, default: null })
    message!: string | null;

    @Prop({ type: String, required: false, default: null })
    url!: string | null;

    @Prop({ required: true })
    criticality!: string;

    @Prop({ required: true, default: 'OPEN' })
    status!: string;

    @Prop({ required: true })
    themeKey!: string;

    @Prop({ required: true, default: () => new Date() })
    createdAt!: Date;

    @Prop({ type: Date, default: null })
    processedAt!: Date | null;
}

export const RequestSchema = SchemaFactory.createForClass(RequestDocument);
