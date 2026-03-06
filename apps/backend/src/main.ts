import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    await app.listen(3000);
    console.log('🐃 Buffalo backend running on http://localhost:3000');
    console.log('📊 GraphQL Playground: http://localhost:3000/graphql');
}
bootstrap();
