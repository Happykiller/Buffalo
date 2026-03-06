import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'request-counters', timestamps: false })
export class RequestCounterDocument extends Document {
    @Prop({ type: String, required: true })
    name!: string;

    @Prop({ type: Number, required: true, default: 0 })
    seq!: number;
}

export const RequestCounterSchema = SchemaFactory.createForClass(RequestCounterDocument);
