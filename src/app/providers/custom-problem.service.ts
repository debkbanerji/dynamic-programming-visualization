import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CustomProblemService {

    private customProblem: any = null;

    constructor() {
    }

    setCustomProblem(problem: any) {
        this.customProblem = problem;
    }

    customProblemExists(): boolean {
        return this.customProblem !== null
    }

    popCustomProblem() {
        const result  = this.customProblem;
        this.customProblem = null;
        return result;
    }
}
