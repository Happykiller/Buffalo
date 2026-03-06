import { registerEnumType } from '@nestjs/graphql';

export enum RequestStatus {
    OPEN = 'OPEN',
    DONE = 'DONE',
}

registerEnumType(RequestStatus, { name: 'RequestStatus' });
