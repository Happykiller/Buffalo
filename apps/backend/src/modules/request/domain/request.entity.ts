import { Criticality } from './criticality.enum';
import { RequestStatus } from './request-status.enum';

export class Request {
    id: string;
    userDisplayName: string;
    requestNumber: number | null;
    message: string | null;
    url: string | null;
    criticality: Criticality;
    status: RequestStatus;
    themeKey: string;
    createdAt: Date;
    processedAt: Date | null;

    constructor(props: {
        id: string;
        userDisplayName: string;
        requestNumber: number | null;
        message: string | null;
        url: string | null;
        criticality: Criticality;
        status: RequestStatus;
        themeKey: string;
        createdAt: Date;
        processedAt: Date | null;
    }) {
        this.id = props.id;
        this.userDisplayName = props.userDisplayName;
        this.requestNumber = props.requestNumber;
        this.message = props.message;
        this.url = props.url;
        this.criticality = props.criticality;
        this.status = props.status;
        this.themeKey = props.themeKey;
        this.createdAt = props.createdAt;
        this.processedAt = props.processedAt;
    }
}
