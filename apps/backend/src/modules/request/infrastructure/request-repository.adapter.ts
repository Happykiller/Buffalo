import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import {
    RequestRepositoryPort,
    RequestFilters,
    CreateRequestData,
    PaginatedRequests,
    RequestStats,
    RequesterStat,
} from '../domain/request-repository.port';
import { Request } from '../domain/request.entity';
import { Criticality } from '../domain/criticality.enum';
import { RequestStatus } from '../domain/request-status.enum';
import { RequestDocument } from './request.schema';
import { RequestCounterDocument } from './request-counter.schema';

// Plages horaires ouvrées : lundi-vendredi, 8h-12h et 13h30-18h
const WORK_SLOTS = [
    { start: 8 * 60, end: 12 * 60 },
    { start: 13.5 * 60, end: 18 * 60 },
];

function workMinutesInDay(fromMin: number, toMin: number): number {
    let total = 0;
    for (const slot of WORK_SLOTS) {
        const s = Math.max(fromMin, slot.start);
        const e = Math.min(toMin, slot.end);
        if (e > s) total += e - s;
    }
    return total;
}

function calcBusinessMinutes(start: Date, end: Date): number {
    if (end <= start) return 0;
    let total = 0;
    let cursor = new Date(start);
    while (cursor < end) {
        const dow = cursor.getDay();
        if (dow >= 1 && dow <= 5) {
            const fromMin =
                cursor.getHours() * 60 + cursor.getMinutes() + cursor.getSeconds() / 60;
            const endOfDay = new Date(cursor);
            endOfDay.setHours(23, 59, 59, 0);
            const cap = end < endOfDay ? end : endOfDay;
            const toMin = cap.getHours() * 60 + cap.getMinutes() + cap.getSeconds() / 60;
            total += workMinutesInDay(fromMin, toMin);
        }
        cursor = new Date(cursor);
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(0, 0, 0, 0);
    }
    return total;
}

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

    async getStats(): Promise<RequestStats> {
        const [statusCounts, critCounts, topRequesters, doneDocs, uniqueRequesters] =
            await Promise.all([
                this.requestModel.aggregate<{ _id: string; count: number }>([
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                ]),
                this.requestModel.aggregate<{ _id: string; count: number }>([
                    { $group: { _id: '$criticality', count: { $sum: 1 } } },
                ]),
                this.requestModel.aggregate<{
                    _id: string;
                    totalCount: number;
                    openCount: number;
                    doneCount: number;
                    urgentCount: number;
                }>([
                    {
                        $group: {
                            _id: '$userDisplayName',
                            totalCount: { $sum: 1 },
                            openCount: { $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] } },
                            doneCount: { $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] } },
                            urgentCount: {
                                $sum: { $cond: [{ $eq: ['$criticality', 'URGENT'] }, 1, 0] },
                            },
                        },
                    },
                    { $sort: { totalCount: -1 } },
                    { $limit: 10 },
                ]),
                this.requestModel
                    .find({ status: 'DONE', processedAt: { $ne: null } })
                    .select({ createdAt: 1, processedAt: 1 })
                    .lean()
                    .exec(),
                this.requestModel.aggregate<{ count: number }>([
                    { $group: { _id: '$userDisplayName' } },
                    { $count: 'count' },
                ]),
            ]);

        const sc = (status: string) => statusCounts.find((s) => s._id === status)?.count ?? 0;
        const cc = (crit: string) => critCounts.find((c) => c._id === crit)?.count ?? 0;

        let avgProcessingTimeMs: number | null = null;
        if (doneDocs.length > 0) {
            const totalBusinessMs = doneDocs.reduce((sum, doc) => {
                const minutes = calcBusinessMinutes(
                    new Date(doc.createdAt),
                    new Date(doc.processedAt as Date),
                );
                return sum + minutes * 60 * 1000;
            }, 0);
            avgProcessingTimeMs = totalBusinessMs / doneDocs.length;
        }

        return {
            totalRequests: sc('OPEN') + sc('DONE'),
            openRequests: sc('OPEN'),
            doneRequests: sc('DONE'),
            byLow: cc('LOW'),
            byMedium: cc('MEDIUM'),
            byHigh: cc('HIGH'),
            byUrgent: cc('URGENT'),
            avgProcessingTimeMs,
            topRequesters: topRequesters.map(
                (r): RequesterStat => ({
                    userDisplayName: r._id,
                    totalCount: r.totalCount,
                    openCount: r.openCount,
                    doneCount: r.doneCount,
                    urgentCount: r.urgentCount,
                }),
            ),
            totalRequesters: uniqueRequesters[0]?.count ?? 0,
        };
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
