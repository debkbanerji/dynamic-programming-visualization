import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AnimationDataService {

    public title: string;
    public log: any;
    public mainTableDimension1: any;
    public mainTableDimension2: any;

    constructor() {
    }

    initialize(
        title,
        log,
        mainTableDimension1,
        mainTableDimension2
    ) {
        this.title = title;
        this.log = log;
        this.mainTableDimension1 = mainTableDimension1;
        this.mainTableDimension2 = mainTableDimension2;

        console.log(title);
        console.log(log);
        console.log(mainTableDimension1);
        console.log(mainTableDimension2);
    }

    is2d() {
        return this.mainTableDimension2 >= 0;
    }

    clear() {
        this.title = null;
        this.log = null;
        this.mainTableDimension1 = null;
        this.mainTableDimension2 = null;
    }
}
