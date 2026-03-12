import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestModule } from './modules/request/request.module';
import { AppResolver } from './app.resolver';

@Module({
    imports: [
        MongooseModule.forRoot(
            process.env.MONGO_URI || 'mongodb://localhost:27017/buffalo',
        ),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            playground: true,
            sortSchema: true,
            subscriptions: {
                'graphql-ws': true,
            },
            context: ({ req, extra }: { req?: unknown; extra?: { request?: unknown } }) => ({
                req: req ?? extra?.request,
            }),
        }),
        RequestModule,
    ],
    providers: [AppResolver],
})
export class AppModule { }
