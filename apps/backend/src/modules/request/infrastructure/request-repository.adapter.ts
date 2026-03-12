import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import {
    RequestRepositoryPort,
    RequestFilters,
    CreateRequestData,
    PaginatedRequests,
} from '../domain/request-repository.port';
import { Request } from '../domain/request.entity';
import { Criticality } from '../domain/criticality.enum';
import { RequestStatus } from '../domain/request-status.enum';
import { RequestDocument } from './request.schema';
import { RequestCounterDocument } from './request-counter.schema';

@Injectable()
export class RequestRepositoryAdapter implements RequestRepositoryPort {
    constructor(
        @InjectModel(RequestDocument.name)
        private readonly requestModel: Model<RequestDocument>,
        @InjectModel(RequestCounterDocument.name)
        private readonly requestCounterModel: Model<RequestCounterDocument>,
    ) { }

    async findAll(filters: RequestFilters): Promise<PaginatedRequests> {
        const query: FilterQuery<RequestDocument> = {};
        const page = Math.max(1, filters.page ?? 1);
        const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.criticality) {
            query.criticality = filters.criticality;
        }
        if (filters.search) {
            query.$or = [
                { message: { $regex: filters.search, $options: 'i' } },
                { userDisplayName: { $regex: filters.search, $options: 'i' } },
            ];
        }

        if (filters.userDisplayName) {
            query.userDisplayName = filters.userDisplayName;
        }

        const [docs, total] = await Promise.all([
            this.requestModel
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .exec(),
            this.requestModel.countDocuments(query).exec(),
        ]);

        const totalPages = Math.max(1, Math.ceil(total / pageSize));

        return {
            items: docs.map(this.toEntity),
            total,
            page,
            pageSize,
            totalPages,
        };
    }

    async findById(id: string): Promise<Request | null> {
        const doc = await this.requestModel.findById(id).exec();
        return doc ? this.toEntity(doc) : null;
    }

    async create(data: CreateRequestData): Promise<Request> {
        const counterDoc = await this.requestCounterModel
            .findOneAndUpdate(
                { name: 'requestNumber' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true, setDefaultsOnInsert: true },
            )
            .exec();
        if (!counterDoc) {
            throw new Error('Unable to allocate request number');
        }

        const doc = await this.requestModel.create({
            userDisplayName: data.userDisplayName,
            requestNumber: counterDoc.seq,
            message: data.message ?? null,
            criticality: data.criticality,
            status: RequestStatus.OPEN,
            themeKey: data.themeKey,
            createdAt: new Date(),
            processedAt: null,
        });
        return this.toEntity(doc);
    }

    async markAsDone(id: string): Promise<Request | null> {
        const doc = await this.requestModel
            .findByIdAndUpdate(
                id,
                { status: RequestStatus.DONE, processedAt: new Date() },
                { new: true },
            )
            .exec();
        return doc ? this.toEntity(doc) : null;
    }

    private toEntity(doc: RequestDocument): Request {
        return new Request({
            id: doc._id.toString(),
            userDisplayName: doc.userDisplayName,
            requestNumber: doc.requestNumber ?? null,
            message: doc.message ?? null,
            criticality: doc.criticality as Criticality,
            status: doc.status as RequestStatus,
            themeKey: doc.themeKey,
            createdAt: doc.createdAt,
            processedAt: doc.processedAt,
        });
    }
}
