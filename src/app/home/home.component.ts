import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {MatDialog} from "@angular/material";
import {PopulateGivenSolutionDialogComponent} from "../dialogs/populate-given-solution-dialog/populate-given-solution-dialog.component";

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

        // initializationCode: '// Any other initialization here',

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

// T(index) for one dimensional tables
// T(rowNumber, columnNumber) for two dimensional tables

// Note the tables are 0 indexed

// Everything else is Javascript

// This means that entries of input tables are still accessed using syntax such as arr[index] or arr[row][column]


// You can resize this text area using the handle at the bottom right (or whatever your browser supports)
`,
        defaultTableEntry: '',
        useDefaultTableEntry: false,

        returnValueCode: 'return 0; // TODO: return correct value',

        nextEntryIndex1: 'i',
        nextEntryIndex2: 'j'
    };

    generatedCode: string = null;

    testResults: any = {};

    transpose2dTable: boolean = false;

    revealedProvidedSolution: boolean = false;

    constructor(private http: HttpClient, public dialog: MatDialog) {
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
            const code = HomeComponent.getPlainRunnableCode(component.providedSolution, component.problem);
            for (let testCaseIndex of component.range(component.testCases.length)) {
                const testCase = component.testCases[testCaseIndex];
                if (!testCase['expected-result'] && !testCase['expected-table']) {
                    const testResult = component.runTest(testCaseIndex, code, component);
                    const testCase = component.testCases[testCaseIndex];
                    console.log(testResult);
                    if (!testCase['expected-result'] && !testCase['expected-table']) {
                        testCase['expected-result'] = testResult['result'];
                        testCase['expected-table'] = testResult['table'];
                    }
                }
            }
            component.problemDefined = true;
        });
    }

    // Returns result of running the test case, as well as the table
    runTest(testCaseIndex: number, plainFunctionCode: string, component: HomeComponent) {
        // TODO: Switch to async
        const code = [];

        const inputMap = component.problem.input;
        const inputs = Object.keys(inputMap).sort();
        const inputVals = component.testCases[testCaseIndex]['input'];

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

        const joinedCode = code.join('');
        console.log(joinedCode);

        const result = {};
        try {
            const testFunction = Function(joinedCode);
            const testResult = testFunction();
            result['result'] = testResult[0];
            result['table'] = testResult[1];
            result['timed-out'] = false;
            result['error'] = null;
        } catch (e) {
            result['result'] = null;
            result['table'] = null;
            result['timed-out'] = false;
            result['error'] = e;
        }
        return result;
    }

    // Returns result of running the test case, as well as the table
    runAllTests(): void {
        // TODO: switch to async
        console.log(JSON.stringify(this.solution));
        const code = HomeComponent.getPlainRunnableCode(this.solution, this.problem);
        this.generatedCode = code
            .replace(new RegExp('\t', 'g'), '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(new RegExp(' {4}', 'g'), '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(new RegExp('\n', 'g'), '<br>');
        for (let i = 0; i < this.testCases.length; i++) {
            this.runTest(i, code, this);
        }
    }

    static getPlainRunnableCode(solution: any, problem: any): string {
        const result = [];
        const is2d = solution.tableShape === '2d';

        let initializationCode = [];
        if (is2d) {
            initializationCode.push('const ', encodedTableName, ' = [];\n');
            initializationCode.push('for (let TABLE__INDEX = 0; TABLE__INDEX < ', solution.tableDimension1, '; TABLE__INDEX++) {\n');
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
        // innerCode.push(solution.initializationCode, '\n\n');
        innerCode.push('for(let ', solution.for1Variable, ' = ', solution.for1Init, '; ', solution.for1Condition, '; ', solution.for1Update, ') {\n\n');
        if (is2d) {
            innerCode.push('\tfor(let ', solution.for2Variable, ' = ', solution.for2Init, '; ', solution.for2Condition, '; ', solution.for2Update, ') {\n\n');
        }

        const setNextEntryCode = solution.setNextEntryCode;
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
        code.push(') {\n');
        if (is2d) {
            code.push('\n\tif(', encodedTableName, '.length <= i || i < 0) {');
            code.push('\n\t\tthrow \'Could not get entry: \' + i + \' is not a valid table row\';');
            code.push('\n\t}\n');
            code.push('\n\tif(', encodedTableName, '[0].length <= j || j < 0) {');
            code.push('\n\t\tthrow \'Could not get entry: \' + j + \' is not a valid table column\';');
            code.push('\n\t}\n')
        } else {
            code.push('\n\tif(', encodedTableName, '.length <= i || i < 0) {');
            code.push('\n\t\tthrow \'Could not get entry: \' + i + \' is not a valid table index\';');
            code.push('\n\t}\n');
        }
        code.push('\n\treturn ', encodedTableName, '[i]');
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
        code.push(') {\n');
        if (is2d) {
            code.push('\n\tif(', encodedTableName, '.length <= i || i < 0) {');
            code.push('\n\t\tthrow \'Could not set entry: \' + i + \' is not a valid table row\';');
            code.push('\n\t}\n');
            code.push('\n\tif(', encodedTableName, '[0].length <= j || j < 0) {');
            code.push('\n\t\tthrow \'Could not set entry: \' + j + \' is not a valid table column\';');
            code.push('\n\t}\n')
        } else {
            code.push('\n\tif(', encodedTableName, '.length <= i || i < 0) {');
            code.push('\n\t\tthrow \'Could not set entry: \' + i + \' is not a valid table index\';');
            code.push('\n\t}\n');
        }
        code.push('\n\t', encodedTableName, '[i]');
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

    openPopulateGivenSolutionDialog(): void {
        const component = this;
        const dialogRef = this.dialog.open(PopulateGivenSolutionDialogComponent, {});

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                component.revealedProvidedSolution = true;
                // component.solution = Object.assign({}, component.providedSolution);
                // deep copy just in case solution format is changed in the future
                component.solution = JSON.parse(JSON.stringify(component.providedSolution));
            }
        });
    }


    getDisplayedValue(value: any): string {
        if (value === null || value === undefined) {
            return '?';
        }
        if ((typeof value) === (typeof 1) || value === 'infinity' || value === '-infinity') {
            if (value === Number.MAX_SAFE_INTEGER || value === Number.MAX_VALUE || value === 'infinity') {
                return '&#x221e;';
            } else if (value === Number.MIN_SAFE_INTEGER || value === Number.MIN_VALUE || value === '-infinity') {
                return '-&#x221e;';
            } else {
                return value !== parseInt(value) ? value.toFixed(2) : Math.floor(value);
            }
        } else if ((typeof value) === (typeof true)) {
            return value ? '<b>&#x2714;</b>' : '<b>&#x2718;</b>';
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
