import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RequestRepositoryPort, REQUEST_REPOSITORY } from '../domain/request-repository.port';
import { Request } from '../domain/request.entity';

@Injectable()
export class MarkRequestDoneUseCase {
    constructor(
        @Inject(REQUEST_REPOSITORY) private readonly requestRepository: RequestRepositoryPort,
    ) { }

    async execute(requestId: string): Promise<Request> {
        const result = await this.requestRepository.markAsDone(requestId);
        if (!result) {
            throw new NotFoundException(`Request ${requestId} not found`);
        }
        return result;
    }
}
