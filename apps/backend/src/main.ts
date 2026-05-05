import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const port = Number.parseInt(process.env.PORT ?? '3200', 10);

    app.enableCors();
    await app.listen(port);
    console.log(`🐃 Buffalo backend running on http://localhost:${port}`);
    console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
}
bootstrap();
