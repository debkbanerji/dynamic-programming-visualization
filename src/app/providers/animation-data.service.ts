import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AnimationDataService {

    public title: string;
    public subtitle: string;
    public result;
    public solution;
    public input: any;
    public log: any;
    public useAuxiliaryTable: boolean;
    public mainTableDimension1: any;
    public mainTableDimension2: any;

    constructor() {
    }

    initialize(
        title,
        subtitle,
        result,
        solution,
        input,
        log,
        useAuxiliaryTable: boolean,
        mainTableDimension1,
        mainTableDimension2
    ) {
        this.title = title;
        this.subtitle = subtitle;
        this.result = result;
        this.solution = solution;
        this.input = input;
        this.log = log;
        this.useAuxiliaryTable = useAuxiliaryTable;
        this.mainTableDimension1 = mainTableDimension1;
        this.mainTableDimension2 = mainTableDimension2;
    }

    clear() {
        this.title = null;
        this.subtitle = null;
        this.result = null;
        this.solution = null;
        this.input = null;
        this.log = null;
        this.useAuxiliaryTable = null;
        this.mainTableDimension1 = null;
        this.mainTableDimension2 = null;
    }
}
