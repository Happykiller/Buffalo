import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestModule } from './modules/request/request.module';

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
        }),
        RequestModule,
    ],
})
export class AppModule { }
