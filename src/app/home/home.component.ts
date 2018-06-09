import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";

const encodedTableName = '___TABLE___';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    objectKeys = Object.keys;

    tableShapes: Array<string> = ['1d', '2d'];

    problemDefined: boolean = false;

    problem: any;
    providedSolution: any;
    testCases: any;

    solution: any = {
        tableShape: this.tableShapes[1],
        tableDimension1: '',
        tableDimension2: '',

        tableDataType: 'number',

        initializationCode: '// Any other initialization here',

        for1Variable: 'i',
        for1Init: '0',
        for1Condition: 'i < (TODO: Define)',
        for1Update: 'i = i + 1',

        for2Variable: 'j',
        for2Init: '0',
        for2Condition: 'j < (TODO: Define)',
        for2Update: 'j = j + 1',

        setNextEntryCode: `// TODO: Set entry = (whatever the next entry should be)

// You can access existing table entries with the following syntax:

// T(42) for one dimensional tables
// T(4,2) for two dimensional tables


// Everything else is Javascript

// You can resize this text area using the handle at the bottom right (or whatever your browser supports)
`,
        defaultTableEntry: '',
        useDefaultTableEntry: false,

        returnValueCode: 'return 0; // TODO: return correct value',

        nextEntryIndex1: 'i',
        nextEntryIndex2: 'j'
    };

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
            component.providedSolution = component.problem['provided-solution'];
            component.testCases = component.problem['test-cases'];
            component.problemDefined = true;
        });
    }

    // Returns result of running the test case, as well as the table
    runTest(testCaseIndex: number, plainFunctionCode: string) {
        const code = [];

        const inputMap = this.problem.input;
        const inputs = Object.keys(inputMap).sort();
        const inputVals = this.testCases[testCaseIndex]['input'];

        for (let i = 0; i < inputs.length; i++) {
            code.push('const ', inputs[i], ' = ');
            const inputVal = inputVals[inputs[i]];
            code.push(JSON.stringify(inputVal));
            code.push(';\n')
        }

        code.push('\n');
        code.push(plainFunctionCode);

        code.push('\n\nalgResult = algorithm(');

        for (let i = 0; i < inputs.length; i++) {
            code.push(inputs[i]);
            // if (i < inputs.length - 1) {
            code.push(', ');
            // }
        }

        code.push(encodedTableName);

        code.push(');\ntable = ', encodedTableName, ';\n');
        code.push('result = [];\n\nresult.push(algResult, table);\n\n');
        code.push('return result;');

        console.log(code.join(''));

        try {
            const testFunction = Function(code.join(''));
            const testResult = testFunction();
            const result = testResult[0];
            const table = testResult[1];
            console.log(result);
            console.log(table);
        } catch (e) {
            console.log(e);
        }
    }

    // Returns result of running the test case, as well as the table
    runAllTests(): void {
        const code = HomeComponent.getPlainRunnableCode(this.solution, this.problem);
        this.runTest(0, code);
    }

    static getPlainRunnableCode(solution: any, problem: any): string {
        const result = [];
        const is2d = solution.tableShape === '2d';

        let initializationCode = [];
        if (is2d) {
            initializationCode.push('const ', encodedTableName, ' = [];\n');
            initializationCode.push('for (let i = 0; i < ', solution.tableDimension1, '; i++) {\n');
            initializationCode.push('\t', encodedTableName, '.push(Array(', solution.tableDimension2, '));\n');
            initializationCode.push('}');
        } else {
            initializationCode.push('const ',
                encodedTableName,
                ' = Array(',
                solution.tableDimension1,
                ');')
        }
        result.push(
            initializationCode.join(''),
            '\n\n',
            HomeComponent.getWrappedGetTableFunction(is2d),
            '\n\n',
            HomeComponent.getPlainGetTableFunction(is2d),
            '\n\n',
            HomeComponent.getPlainSetTableFunction(is2d),
            '\n\n',
            HomeComponent.getAlgorithmCode(solution, problem)
        );
        return result.join('');
    }

    // Generate code that returns the table and result without altering the UI
    // Note: code takes in inputs in alphabetical order
    static getAlgorithmCode(solution: any, problem: any): string {
        const outerCode = [];
        const is2d = solution.tableShape === '2d';

        outerCode.push('const algorithm = function(');

        const inputMap = problem.input;
        const inputs = Object.keys(inputMap).sort();
        for (let i = 0; i < inputs.length; i++) {
            outerCode.push(inputs[i]);
            // if (i < inputs.length - 1) {
            outerCode.push(', ');
            // }
        }

        outerCode.push(encodedTableName);

        outerCode.push(') {\n\n');

        const innerCode = [];
        innerCode.push('\t');
        // innerCode.push(encodedTableName, ' = [');
        // if (is2d) {
        //     innerCode.push('[],[]');
        // }
        // innerCode.push('];\n\n');
        innerCode.push(solution.initializationCode, '\n\n');
        innerCode.push('for(let ', solution.for1Variable, ' = ', solution.for1Init, '; ', solution.for1Condition, '; ', solution.for1Update, ') {\n\n');
        if (is2d) {
            innerCode.push('\tfor(let ', solution.for2Variable, ' = ', solution.for2Init, '; ', solution.for2Condition, '; ', solution.for2Update, ') {\n\n');
        }

        const setNextEntryCode = solution.setNextEntryCode;
        console.log(setNextEntryCode);
        innerCode.push('\t');
        if (is2d) {
            innerCode.push('\t');
            if (solution.useDefaultTableEntry) {
                innerCode.push('let entry = ', solution.defaultTableEntry, ';\n\n\t\t');
            } else {
                innerCode.push('let entry = null;\n\t\t');
            }
            innerCode.push(setNextEntryCode.replace(/(?:\r\n|\r|\n)/g, '\n\t\t'));
        } else {
            if (solution.useDefaultTableEntry) {
                innerCode.push('let entry = ', solution.defaultTableEntry, ';\n\n\t');
            } else {
                innerCode.push('let entry = null;\n\n\t');
            }
            innerCode.push(setNextEntryCode.replace(/(?:\r\n|\r|\n)/g, '\n\t'));
        }
        innerCode.push('\n\n\t', is2d ? '\t' : '', 'set', encodedTableName, '(entry, ', solution.nextEntryIndex1);
        if (is2d) {
            innerCode.push(', ', solution.nextEntryIndex2);
        }
        innerCode.push(', ', encodedTableName, ');\n');
        if (is2d) {
            innerCode.push('\t}\n\n');
        }
        innerCode.push('}\n\n');
        innerCode.push(solution.returnValueCode);

        outerCode.push(innerCode.join('').replace(/(?:\r\n|\r|\n)/g, '\n\t'));
        outerCode.push('\n\n};');

        return outerCode.join('')
    }

    // Returns a function that gets from the table without altering UI
    static getWrappedGetTableFunction(is2d: boolean): string {
        const code = [];
        code.push('const get');
        code.push(encodedTableName);
        code.push(' = function(i');
        if (is2d) {
            code.push(', j');
        }
        code.push(', ', encodedTableName);
        code.push(') {\n\treturn ', encodedTableName, '[i]');
        if (is2d) {
            code.push('[j]')
        }
        code.push(';\n};');
        return code.join('');
    }

    // Returns a function that gets from the table without altering UI
    static getPlainGetTableFunction(is2d: boolean): string {
        const code = [];

        code.push('const T = function(i');
        if (is2d) {
            code.push(', j');
        }
        code.push(') {\n\treturn get', encodedTableName, '(i, ');
        if (is2d) {
            code.push('j, ')
        }
        code.push(encodedTableName, ');\n};');
        return code.join('');
    }

    static getPlainSetTableFunction(is2d: boolean): string {
        const code = [];
        code.push('const set');
        code.push(encodedTableName);
        code.push(' = function(val, i');
        if (is2d) {
            code.push(', j');
        }
        code.push(', ', encodedTableName);
        code.push(') {\n\t', encodedTableName, '[i]');
        if (is2d) {
            code.push('[j]')
        }
        code.push(' = val;\n};');
        return code.join('');
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

    // static makeRandomVarName(): string {
    //     const result = ['_'];
    //     const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    //     for (let i = 0; i < 5; i++)
    //         result.push(possible.charAt(Math.floor(Math.random() * possible.length)));
    //
    //     return result.join('');
    // }

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
