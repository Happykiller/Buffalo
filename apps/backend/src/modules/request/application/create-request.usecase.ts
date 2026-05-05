import { Injectable, Inject } from '@nestjs/common';
import { RequestRepositoryPort, REQUEST_REPOSITORY } from '../domain/request-repository.port';
import { CreateRequestDto } from './create-request.dto';
import { Request } from '../domain/request.entity';

@Injectable()
export class CreateRequestUseCase {
    constructor(
        @Inject(REQUEST_REPOSITORY) private readonly requestRepository: RequestRepositoryPort,
    ) { }

    async execute(dto: CreateRequestDto): Promise<Request> {
        return this.requestRepository.create({
            userDisplayName: dto.userDisplayName,
            message: dto.message ?? null,
            url: dto.url ?? null,
            criticality: dto.criticality,
            themeKey: dto.themeKey,
        });
    }
}
