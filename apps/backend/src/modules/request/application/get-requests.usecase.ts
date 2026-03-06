import { Injectable, Inject } from '@nestjs/common';
import { RequestRepositoryPort, REQUEST_REPOSITORY, RequestFilters, PaginatedRequests } from '../domain/request-repository.port';

@Injectable()
export class GetRequestsUseCase {
    constructor(
        @Inject(REQUEST_REPOSITORY) private readonly requestRepository: RequestRepositoryPort,
    ) { }

    async execute(filters: RequestFilters): Promise<PaginatedRequests> {
        return this.requestRepository.findAll(filters);
    }
}
