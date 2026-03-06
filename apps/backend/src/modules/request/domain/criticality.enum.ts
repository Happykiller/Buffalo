import { registerEnumType } from '@nestjs/graphql';

export enum Criticality {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

registerEnumType(Criticality, { name: 'Criticality' });
