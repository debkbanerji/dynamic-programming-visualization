import {Component, OnInit} from '@angular/core';
import {Http} from "@angular/http";
import {HttpClient} from "@angular/common/http";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    tableSizes: Array<string> = ['1d', '2d'];
    tableSize = this.tableSizes[1];

    problemDefined: boolean = false;

    problem: any;
    solution: any;
    testCases: any;

    transpose2dTable: boolean = false;

    constructor(private http: HttpClient) {
    }

    ngOnInit() {
        this.loadProblem('knapsack-without-repitition.dp.json');
    }

    loadProblem(problemFileName: string): void {
        const component = this;
        component.http.get('../assets/problems/' + problemFileName).subscribe(data => {
            component.problem = data;
            component.solution = component.problem['solution'];
            component.testCases = component.problem['test-cases'];
            component.problemDefined = true;
        });
    }

    transposeTable(): void {
        this.transpose2dTable = !this.transpose2dTable;
        // TODO: Rerun test cases
    }

    range(_p: number, _t?: number, _s?: number): Array<number> {

        let start: number = (_t) ? _p : 0;
        let stop: number = (_t) ? _t : _p;
        let step: number = (_s) ? _s : 1;

        let t: Array<number> = [];
        for (let i = start; i < stop; i = i + step) {
            t.push(i);
        }

        return t;
    }
}
