import { Resolver, Query } from '@nestjs/graphql';
import * as fs from 'fs';
import * as path from 'path';

@Resolver()
export class AppResolver {
    @Query(() => String)
    backendVersion(): string {
        try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            return pkg.version || '0.0.0';
        } catch (e) {
            return 'unknown';
        }
    }
}
