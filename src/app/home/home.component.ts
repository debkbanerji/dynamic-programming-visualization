import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    objectKeys = Object.keys;

    tableShapes: Array<string> = ['1d', '2d'];
    tableShape = this.tableShapes[1];

    problemDefined: boolean = false;

    problem: any;
    solution: any;
    testCases: any;

    tableDimension1: string = '';
    tableDimension2: string = '';

    tableDataType: string = 'number';

    for1Variable: string = 'i';
    for1Init: string = '0';
    for1Condition: string = 'i < (TODO: Define)';
    for1Update: string = 'i = i + 1';

    for2Variable: string = 'j';
    for2Init: string = '0';
    for2Condition: string = 'j < (TODO: Define)';
    for2Update: string = 'j = j + 1';

    setNextEntryCode: string = `// TODO: Set entry = (whatever the next entry should be)

// You can use existing table entries with the following syntax:

// T[42] for one dimensional tables
// T[4][2] for two dimensional tables


// Note: The language used is Javascript

// You can resize this text area using the handle at the bottom right (or whatever your browser supports)
`;
    defaultTableEntry: string = '';
    useDefaultTableEntry: boolean = false;

    returnValueCode: string = 'return 0; // TODO: return correct value';

    nextEntryIndex1: string = 'i';
    nextEntryIndex2: string = 'j';

    testResults: any = {};

    transpose2dTable: boolean = false;

    constructor(private http: HttpClient) {
    }

    ngOnInit() {
        this.loadProblem('knapsack-without-repitition.dp.json');
        const smallInputFields = document.getElementsByClassName('input-field-small');
        for (let i = 0; i < smallInputFields.length; i++) {
            const el = smallInputFields[i];
            this.makeResizable(el, 7.5);
        }
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

    // Returns result of running the test case, as well as the table
    runTest(testCase: string) {
        const code = this.getGeneratedCode();
    }

    getGeneratedCode(): string {
        const code = [];
        return code.join('')
    }

    transposeTable(): void {
        this.transpose2dTable = !this.transpose2dTable;
        // TODO: Rerun test cases
    }

    getDisplayedValue(value: any, type: string): string {
        if (value === null || value === undefined) {
            return '?';
        }
        if (type === 'int' || type === 'float' || type === 'number') {
            if (value === Number.MAX_SAFE_INTEGER || value === Number.MAX_VALUE || value === 'infinity') {
                return '&#x221e;';
            } else if (value === Number.MIN_SAFE_INTEGER || value === Number.MIN_VALUE || value === '-infinity') {
                return '-&#x221e;';
            } else {
                if (type === 'float' || type === 'number') {
                    return value !== parseInt(value) ? value.toFixed(2) : Math.floor(value);
                } else {
                    return value;
                }
            }
        } else if (type === 'boolean') {
            return value ? '&#x2714;' : '&#x2718;';
        } else {
            return 'Unrecognized type';
        }
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

    makeResizable(el, factor) {
        let int = Number(factor) || 7.7;

        function resize() {
            el.style.width = ((Math.max(el.value.length, 1) + 1) * int) + 'px'
        }

        let e = 'keyup,keypress,focus,blur,change'.split(',');
        for (let i in e) {
            el.addEventListener(e[i], resize, false);
        }
        resize();
    }
}
