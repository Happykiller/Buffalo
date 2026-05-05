import { Criticality } from '../domain/criticality.enum';

export class CreateRequestDto {
    userDisplayName: string;
    message: string | null;
    url: string | null;
    criticality: Criticality;
    themeKey: string;

    constructor(props: CreateRequestDto) {
        this.userDisplayName = props.userDisplayName;
        this.message = props.message;
        this.url = props.url;
        this.criticality = props.criticality;
        this.themeKey = props.themeKey;
    }
}
