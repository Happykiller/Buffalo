import { Request } from './request.entity';
import { Criticality } from './criticality.enum';
import { RequestStatus } from './request-status.enum';

export const REQUEST_REPOSITORY = Symbol('REQUEST_REPOSITORY');

export interface RequestFilters {
    status?: RequestStatus;
    criticality?: Criticality;
    search?: string;
    page?: number;
    pageSize?: number;
    userDisplayName?: string;
}

export interface PaginatedRequests {
    items: Request[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface CreateRequestData {
    userDisplayName: string;
    message: string | null;
    criticality: Criticality;
    themeKey: string;
}

export interface RequestRepositoryPort {
    findAll(filters: RequestFilters): Promise<PaginatedRequests>;
    findById(id: string): Promise<Request | null>;
    create(data: CreateRequestData): Promise<Request>;
    markAsDone(id: string): Promise<Request | null>;
}
