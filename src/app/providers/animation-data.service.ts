import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AnimationDataService {

    public title: string;
    public result;
    public log: any;
    public mainTableDimension1: any;
    public mainTableDimension2: any;

    constructor() {
    }

    initialize(
        title,
        result,
        log,
        mainTableDimension1,
        mainTableDimension2
    ) {
        this.title = title;
        this.result = result;
        this.log = log;
        this.mainTableDimension1 = mainTableDimension1;
        this.mainTableDimension2 = mainTableDimension2;
    }

    is2d() {
        return this.mainTableDimension2 >= 0;
    }

    clear() {
        this.title = null;
        this.result = null;
        this.log = null;
        this.mainTableDimension1 = null;
        this.mainTableDimension2 = null;
    }
}
