import { Injectable, Inject } from '@nestjs/common';
import { REQUEST_REPOSITORY, RequestRepositoryPort, RequestStats } from '../domain/request-repository.port';

@Injectable()
export class GetStatsUseCase {
    constructor(
        @Inject(REQUEST_REPOSITORY)
        private readonly requestRepository: RequestRepositoryPort,
    ) {}

    execute(): Promise<RequestStats> {
        return this.requestRepository.getStats();
    }
}
