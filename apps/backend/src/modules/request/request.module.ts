import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestDocument, RequestSchema } from './infrastructure/request.schema';
import { RequestCounterDocument, RequestCounterSchema } from './infrastructure/request-counter.schema';
import { RequestRepositoryAdapter } from './infrastructure/request-repository.adapter';
import { REQUEST_REPOSITORY } from './domain/request-repository.port';
import { CreateRequestUseCase } from './application/create-request.usecase';
import { GetRequestsUseCase } from './application/get-requests.usecase';
import { MarkRequestDoneUseCase } from './application/mark-request-done.usecase';
import { RequestResolver } from './interfaces/graphql/request.resolver';
import { LocalhostAdminGuard } from './interfaces/graphql/localhost-admin.guard';
import { PubSub } from 'graphql-subscriptions';
import { REQUEST_PUB_SUB } from './interfaces/graphql/request-events';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: RequestDocument.name, schema: RequestSchema },
            { name: RequestCounterDocument.name, schema: RequestCounterSchema },
        ]),
    ],
    providers: [
        { provide: REQUEST_REPOSITORY, useClass: RequestRepositoryAdapter },
        { provide: REQUEST_PUB_SUB, useFactory: () => new PubSub() },
        CreateRequestUseCase,
        GetRequestsUseCase,
        MarkRequestDoneUseCase,
        RequestResolver,
        LocalhostAdminGuard,
    ],
})
export class RequestModule { }
