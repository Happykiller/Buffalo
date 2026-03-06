import { Resolver, Query, Mutation, Args, Int, Subscription } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { RequestType } from './request.type';
import { RequestPageType } from './request-page.type';
import { CreateRequestInput } from './create-request.input';
import { Criticality } from '../../domain/criticality.enum';
import { RequestStatus } from '../../domain/request-status.enum';
import { CreateRequestUseCase } from '../../application/create-request.usecase';
import { GetRequestsUseCase } from '../../application/get-requests.usecase';
import { MarkRequestDoneUseCase } from '../../application/mark-request-done.usecase';
import { LocalhostAdminGuard } from './localhost-admin.guard';
import { REQUEST_PUB_SUB, REQUEST_CREATED_EVENT, REQUEST_UPDATED_EVENT } from './request-events';

@Resolver(() => RequestType)
export class RequestResolver {
    constructor(
        private readonly createRequestUseCase: CreateRequestUseCase,
        private readonly getRequestsUseCase: GetRequestsUseCase,
        private readonly markRequestDoneUseCase: MarkRequestDoneUseCase,
        @Inject(REQUEST_PUB_SUB) private readonly pubSub: PubSub,
    ) { }

    @Query(() => RequestPageType, { name: 'requests' })
    @UseGuards(LocalhostAdminGuard)
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
        const request = await this.createRequestUseCase.execute({
            userDisplayName: input.userDisplayName,
            message: input.message ?? null,
            criticality: input.criticality,
            themeKey: input.themeKey,
        });
        await this.pubSub.publish(REQUEST_CREATED_EVENT, { requestCreated: request });
        return request;
    }

    @Mutation(() => RequestType)
    @UseGuards(LocalhostAdminGuard)
    async markRequestAsDone(
        @Args('requestId') requestId: string,
    ): Promise<RequestType> {
        const request = await this.markRequestDoneUseCase.execute(requestId);
        await this.pubSub.publish(REQUEST_UPDATED_EVENT, { requestUpdated: request });
        return request;
    }

    @Subscription(() => RequestType)
    @UseGuards(LocalhostAdminGuard)
    requestCreated() {
        return this.pubSub.asyncIterableIterator(REQUEST_CREATED_EVENT);
    }

    @Subscription(() => RequestType)
    @UseGuards(LocalhostAdminGuard)
    requestUpdated() {
        return this.pubSub.asyncIterableIterator(REQUEST_UPDATED_EVENT);
    }
}
