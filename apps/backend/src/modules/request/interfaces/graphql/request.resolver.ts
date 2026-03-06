import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { RequestType } from './request.type';
import { RequestPageType } from './request-page.type';
import { CreateRequestInput } from './create-request.input';
import { Criticality } from '../../domain/criticality.enum';
import { RequestStatus } from '../../domain/request-status.enum';
import { CreateRequestUseCase } from '../../application/create-request.usecase';
import { GetRequestsUseCase } from '../../application/get-requests.usecase';
import { MarkRequestDoneUseCase } from '../../application/mark-request-done.usecase';

@Resolver(() => RequestType)
export class RequestResolver {
    constructor(
        private readonly createRequestUseCase: CreateRequestUseCase,
        private readonly getRequestsUseCase: GetRequestsUseCase,
        private readonly markRequestDoneUseCase: MarkRequestDoneUseCase,
    ) { }

    @Query(() => RequestPageType, { name: 'requests' })
    async getRequests(
        @Args('status', { type: () => RequestStatus, nullable: true }) status?: RequestStatus,
        @Args('criticality', { type: () => Criticality, nullable: true }) criticality?: Criticality,
        @Args('search', { type: () => String, nullable: true }) search?: string,
        @Args('page', { type: () => Int, nullable: true }) page?: number,
        @Args('pageSize', { type: () => Int, nullable: true }) pageSize?: number,
    ): Promise<RequestPageType> {
        return this.getRequestsUseCase.execute({ status, criticality, search, page, pageSize });
    }

    @Mutation(() => RequestType)
    async createRequest(
        @Args('input') input: CreateRequestInput,
    ): Promise<RequestType> {
        return this.createRequestUseCase.execute({
            userDisplayName: input.userDisplayName,
            message: input.message ?? null,
            criticality: input.criticality,
            themeKey: input.themeKey,
        });
    }

    @Mutation(() => RequestType)
    async markRequestAsDone(
        @Args('requestId') requestId: string,
    ): Promise<RequestType> {
        return this.markRequestDoneUseCase.execute(requestId);
    }
}
