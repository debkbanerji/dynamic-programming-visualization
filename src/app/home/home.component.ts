import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {MatDialog} from "@angular/material";
import {ConfirmationDialogComponent} from "../dialogs/confirmation-dialog/confirmation-dialog.component";

const encodedTableName = '___TABLE___';
const auxiliaryTableName = '___AUX_TABLE___';
const logName = '___LOG___';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    objectKeys = Object.keys;

    problemFileName: string = 'knapsack-without-repetition.dp.json';

    tableShapes: Array<string> = ['1d', '2d'];

    approaches: Array<string> = ['bottom-up', 'top-down'];
    approach = this.approaches[0];

    problemDefined: boolean = false;

    problem: any;
    providedSolution: any;
    testCases: any;

    // If true, we care about how the user got their result
    // If false, only a single return value is expected
    expectDetailedSolution: boolean = false;

    solution: any = {
        tableShape: this.tableShapes[0],
        tableDimension1: '',
        tableDimension2: '',

        initializationCode: '// Any other initialization here',

        for1Variable: 'i',
        for1Init: '0',
        for1Condition: 'i < (TODO: Define)',
        for1Update: 'i = i + 1',

        for2Variable: 'j',
        for2Init: '0',
        for2Condition: 'j < (TODO: Define)',
        for2Update: 'j = j + 1',

        setNextEntryCode: `// TODO: Set entry = (whatever the next entry should be)`,
        defaultTableEntry: '',
        useDefaultTableEntry: false,

        returnValueCode: 'return 0; // TODO: return correct value',

        nextEntryIndex1: 'i',
        nextEntryIndex2: 'j',

        useAuxillaryTable: false,
        auxiliaryTableDimension1: '',
        auxiliaryTableDimension2: '',
    };

    generatedCode: string = null;

    testResults: any = {};

    testTimeLimit = 3000; // Time limit in milliseconds per test

    transpose2dTable: boolean = false;

    revealedProvidedSolution: boolean = false;

    numRunTestCases: number = 0;
    numPassedTestCases: number = 0;
    numFailedTestCases: number = 0;
    numCrashedTestCases: number = 0;
    numTimedOutTestCases: number = 0;
    numExpectedTables: number = 0;
    numMatchingTableDimensions: number = 0;
    testsCurrentlyRunning: boolean = false;

    constructor(private http: HttpClient, public dialog: MatDialog) {
    }

    ngOnInit() {
        this.loadProblem(this.problemFileName);
        this.makeInputsResizable();
    }

    makeInputsResizable() {
        const smallInputFields = document.getElementsByClassName('input-field-small');
        for (let i = 0; i < smallInputFields.length; i++) {
            const el = smallInputFields[i];
            this.makeResizable(el, 7.5);
        }
    }

    loadProblem(problemFileName: string): void {
        const component = this;
        // TODO: Get from service
        component.http.get('../assets/problems/' + problemFileName).subscribe(data => {
            component.problem = data;
            component.providedSolution = component.problem['provided-solution'];
            component.testCases = component.problem['test-cases'];
            component.problemDefined = true;
            component.recalculateExpectedResults();
        });
    }

    recalculateExpectedResults() {
        const component = this;
        // We're always calculating the detailed solution if we're using the provided solution
        const code = HomeComponent.getPlainRunnableCode(component.providedSolution, component.problem, false, true, component.providedSolution.useAuxiliaryTableWithDetailedSolution);
        component.testsCurrentlyRunning = true;
        component.runTestsWithProvidedSolution(component, 0, code);

    }

    runTestsWithProvidedSolution(component: HomeComponent, testCaseIndex: number, code: string): void {
        if (testCaseIndex < component.testCases.length) {
            const testCase = component.testCases[testCaseIndex];
            if (!testCase['expected-result'] && !testCase['expected-table']) {
                const detailedSolution = component.providedSolution.detailedSetNextEntryCode && component.providedSolution.detailedReturnValueCode;
                const auxiliaryTable = detailedSolution && component.providedSolution.useAuxiliaryTableWithDetailedSolution;
                component.runTest(testCaseIndex, code, component, false, detailedSolution, auxiliaryTable, function (testResult) {
                    if (testResult['error']) {
                        console.log('Test error', testResult['error']);
                        component.raiseProvidedSolutionError(testResult['error'].message);
                    } else if (testResult['timed-out']) {
                        component.raiseProvidedSolutionError('Test ' + testCaseIndex + ' timed out');
                    } else {
                        const testCase = component.testCases[testCaseIndex];
                        if (!testCase['expected-result'] && !testCase['expected-table']) {
                            testCase['expected-result'] = testResult['result'];
                            testCase['expected-table'] = testResult['table'];
                            // testCase['detailed-solution'] = detailedSolution;
                            // testCase['auxiliaryTable'] = testResult;
                            if (detailedSolution) {
                                testCase['expected-solution'] = testResult['solution'];
                                if (auxiliaryTable) {
                                    testCase['expected-auxiliary-table'] = testResult['auxiliary-table'];
                                }
                            }
                        }
                        component.runTestsWithProvidedSolution(component, testCaseIndex + 1, code);
                    }
                });
            } else {
                component.runTestsWithProvidedSolution(component, testCaseIndex + 1, code);
            }
        } else {
            component.testsCurrentlyRunning = false;
        }
    }

    // Returns result of running the test case, as well as the table
    runTest(testCaseIndex: number, plainFunctionCode: string, component: HomeComponent, isTopDown: boolean, detailedSolution: boolean, auxiliaryTable: boolean, callback: Function) {
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

        code.push('\ntry {\n');

        code.push('\n');
        code.push(plainFunctionCode);

        code.push('\n\n\t// FUNCTION CODE END\n\n');
        code.push('const algResult = algorithm(');
        for (let i = 0; i < inputs.length; i++) {
            code.push(inputs[i]);
            if (i < inputs.length - 1) {
                code.push(', ');
            }
        }
        code.push(');\n\ntestResult = {};\n\ntestResult.result = algResult.result;');
        code.push('\ntestResult.table = ', encodedTableName, ';\ntestResult.log = ', logName, ';\n\n');
        if (detailedSolution) {
            code.push('\ntestResult.solution = algResult.solution;');
        }
        if (auxiliaryTable) {
            code.push('\ntestResult.auxiliaryTable = ', auxiliaryTableName, ';');
        }
        code.push('\npostMessage(testResult);\n');
        code.push('self.close();\n\n');
        code.push('} catch(e) {\n');
        code.push('\npostMessage({\'error\':e.stack});\n');
        code.push('\nself.close();\n\n}');

        const joinedCode = code.join('');
        console.log(joinedCode);

        const result = {};

        const _blob = new Blob([joinedCode], {type: 'text/javascript'});
        const _worker = new Worker(window.URL.createObjectURL(_blob));
        let testCaseFinished = false;
        _worker.onmessage = function (m) {
            testCaseFinished = true;
            const testResult = m.data;
            if (testResult['error']) {
                result['result'] = null;
                result['table'] = null;
                result['log'] = null;
                result['timed-out'] = false;
                result['error'] = component.getSectionSpecificErrorMessage(testResult['error'], joinedCode, true, isTopDown);
                callback(result);
            } else {
                result['result'] = testResult['result'];
                result['table'] = testResult['table'];
                result['log'] = testResult['log'];
                result['timed-out'] = false;
                result['error'] = null;
                if (detailedSolution) {
                    result['solution'] = testResult['solution'];
                }
                if (auxiliaryTable) {
                    result['auxiliary-table'] = testResult['auxiliaryTable'];
                }
                callback(result);
            }
        };
        _worker.onerror = function (e) {
            testCaseFinished = true;
            result['result'] = null;
            result['table'] = null;
            result['log'] = null;
            result['timed-out'] = false;
            result['error'] = component.getSectionSpecificErrorMessage(e, joinedCode, false, isTopDown);
            callback(result);
        };

        setTimeout(function () {
            if (!testCaseFinished) {
                _worker.terminate();
                result['result'] = null;
                result['table'] = null;
                result['log'] = null;
                result['timed-out'] = true;
                result['error'] = null;
                callback(result);
            }
        }, component.testTimeLimit);
        // start worker
        _worker.postMessage('Heyy');
    }

    // Returns result of running the test case, as well as the table
    runAllTestsWithUserSolution(): void {
        this.numRunTestCases = 0;
        this.numPassedTestCases = 0;
        this.numFailedTestCases = 0;
        this.numCrashedTestCases = 0;
        this.numTimedOutTestCases = 0;
        this.numExpectedTables = 0;
        this.numMatchingTableDimensions = 0;
        this.testsCurrentlyRunning = true;
        const code = HomeComponent.getPlainRunnableCode(this.solution, this.problem, this.approach === this.approaches[1], this.expectDetailedSolution, this.expectDetailedSolution && this.providedSolution.useAuxiliaryTableWithDetailedSolution);
        this.generatedCode = code
            .replace(new RegExp('\t', 'g'), '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(new RegExp(' {4}', 'g'), '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(new RegExp('\n', 'g'), '<br>');
        this.runTestsWithUserSolution(this, 0, code);
    }

    runTestsWithUserSolution(component: HomeComponent, testCaseIndex: number, code: string) {
        if (testCaseIndex < component.testCases.length) {
            component.runTest(testCaseIndex, code, component, component.approach === component.approaches[1], component.expectDetailedSolution, component.expectDetailedSolution && component.providedSolution.useAuxiliaryTableWithDetailedSolution, function (testResult) {
                let testCase = component.testCases[testCaseIndex];
                const expectedTable = testCase['expected-table'];
                testResult['has-expected-table'] = !testResult['error'] && !testResult['timed-out'] && component.isExpectedTable(expectedTable, testResult['table'], component.approach === component.approaches[1], component);
                component.testResults[testCaseIndex] = testResult;
                component.numRunTestCases++;
                if (testResult['result'] === testCase['expected-result']) {
                    component.numPassedTestCases++;
                } else if (!testResult['error'] && !testResult['timed-out']) {
                    component.numFailedTestCases++;
                }
                if (testResult['error']) {
                    component.numCrashedTestCases++;
                }
                if (testResult['timed-out']) {
                    component.numTimedOutTestCases++;
                }
                if (testResult['has-expected-table']) {
                    component.numExpectedTables++;
                }
                if (component.haveEqualDimensions(testResult['table'], testCase['expected-table'])) {
                    component.numMatchingTableDimensions++;
                }
                component.runTestsWithUserSolution(component, testCaseIndex + 1, code);
            });
        }
        else {
            this.testsCurrentlyRunning = false;
        }
    }

    static getPlainRunnableCode(solution: any, problem: any, useTopDown: boolean, detailedSolution: boolean, auxiliaryTable: boolean): string {
        const result = [];
        const is2d = solution.tableShape === '2d';

        let initializationCode = [];
        initializationCode.push('// TABLE SHAPE: ', solution.tableShape, '\n');
        initializationCode.push('// TABLE INITIALIZATION CODE START\n');
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
        if (auxiliaryTable) {
            if (is2d) {
                initializationCode.push('\nconst ', auxiliaryTableName, ' = [];\n');
                initializationCode.push('for (let TABLE__INDEX = 0; TABLE__INDEX < ', solution.auxiliaryTableDimension1, '; TABLE__INDEX++) {\n');
                initializationCode.push('\t', auxiliaryTableName, '.push(Array(', solution.auxiliaryTableDimension2, '));\n');
                initializationCode.push('}');
            } else {
                initializationCode.push('const ',
                    encodedTableName,
                    ' = Array(',
                    solution.tableDimension1,
                    ');')
            }
        }
        initializationCode.push('\n// TABLE INITIALIZATION CODE END\n');
        initializationCode.push('\nconst ', logName, ' = [];\n');
        result.push(
            initializationCode.join(''),
            '\n\n',
            HomeComponent.getWrappedGetTableFunction(is2d),
            '\n\n',
            HomeComponent.getPlainGetTableFunction(is2d, false),
            '\n\n',
            (auxiliaryTable ? HomeComponent.getPlainGetTableFunction(is2d, true) + '\n\n' : ''),
            HomeComponent.getPlainSetTableFunction(is2d),
            '\n\n',
            HomeComponent.getAlgorithmCode(solution, problem, useTopDown, detailedSolution, auxiliaryTable)
        );
        return result.join('');
    }

    // Generate code that returns the table and result without altering the UI
    // Note: code takes in inputs in alphabetical order
    static getAlgorithmCode(solution: any, problem: any, useTopDown: boolean, detailedSolution: boolean, auxiliaryTable: boolean): string {
        const outerCode = [];
        const is2d = solution.tableShape === '2d';

        outerCode.push('const algorithm = function(');

        const inputMap = problem.input;
        const inputs = Object.keys(inputMap).sort();
        for (let i = 0; i < inputs.length; i++) {
            outerCode.push(inputs[i]);
            if (i < inputs.length - 1) {
                outerCode.push(', ');
            }
        }

        // outerCode.push(encodedTableName);

        outerCode.push(') {\n\n');

        const innerCode = [];

        if (!useTopDown) {
            innerCode.push('\t// INITIALIZATION CODE START\n\n');
            innerCode.push(solution.initializationCode, '\n\n');
            innerCode.push('// LOOP CODE START\n\n');
            innerCode.push('for(let ', solution.for1Variable, ' = ', solution.for1Init, '; ', solution.for1Condition, '; ', solution.for1Update, ') {\n\n');
            if (is2d) {
                innerCode.push('\tfor(let ', solution.for2Variable, ' = ', solution.for2Init, '; ', solution.for2Condition, '; ', solution.for2Update, ') {\n\n');
            }

            const setNextEntryCode = solution.setNextEntryCode;
            if (is2d) {
                innerCode.push('\t\t// DEFAULT VALUE CODE START\n\n\t\t');
                if (solution.useDefaultTableEntry) {
                    innerCode.push('let entry = ', solution.defaultTableEntry, ';\n\n\t\t');
                } else {
                    innerCode.push('let entry = null;\n\n\t\t');
                }
                innerCode.push('\t\t// SET NEXT ENTRY CODE START\n\n\t\t');
                innerCode.push(setNextEntryCode.replace(/(?:\r\n|\r|\n)/g, '\n\t\t'));
            } else {
                innerCode.push('\t// DEFAULT VALUE CODE START\n\n\t');
                if (solution.useDefaultTableEntry) {
                    innerCode.push('let entry = ', solution.defaultTableEntry, ';\n\n\t');
                } else {
                    innerCode.push('let entry = null;\n\n\t');
                }
                innerCode.push('\t// SET NEXT ENTRY CODE START\n\n\t');
                innerCode.push(setNextEntryCode.replace(/(?:\r\n|\r|\n)/g, '\n\t'));
            }
            innerCode.push('\t// SET NEXT ENTRY CODE END\n');
            innerCode.push('\n\n\t', is2d ? '\t' : '', 'set', encodedTableName, '(entry, ', solution.nextEntryIndex1);
            if (is2d) {
                innerCode.push(', ', solution.nextEntryIndex2);
            }
            innerCode.push(', ', encodedTableName, ', ', logName, ', false);\n');
            innerCode.push('\n\n\t', is2d ? '\t' : '', 'set', encodedTableName, '(auxEntry, ', solution.nextEntryIndex1);
            if (is2d) {
                innerCode.push(', ', solution.nextEntryIndex2);
            }
            innerCode.push(', ', auxiliaryTableName, ', ', logName, ', true);\n');
            if (is2d) {
                innerCode.push('\t}\n\n');
            }
            innerCode.push('}\n\n');
            innerCode.push('// RETURN VALUE CODE START\n\n');
            innerCode.push(solution.returnValueCode, '\n');
        } else {
            const dimensions = '(i' + (is2d ? ', j' : '') + ')';
            innerCode.push('\t// INITIALIZATION CODE START\n\n');
            innerCode.push(solution.initializationCode, '\n\n');
            innerCode.push('\nfunction getTableEntry', dimensions, ' {');
            innerCode.push('\n\tlet ___CURRENT_TABLE_ELEMENT___ = T', dimensions, ';');
            innerCode.push('\n\tif (___CURRENT_TABLE_ELEMENT___ !== null && ___CURRENT_TABLE_ELEMENT___ !== undefined) {');
            innerCode.push('\n\t\treturn ___CURRENT_TABLE_ELEMENT___;');
            innerCode.push('\n\t} else {');
            const setNextEntryCode = solution.setNextEntryCode;
            innerCode.push('\n\t\t\t// DEFAULT VALUE CODE START\n\n\t\t');
            if (solution.useDefaultTableEntry) {
                innerCode.push('let entry = ', solution.defaultTableEntry, ';\n\n\t\t');
            } else {
                innerCode.push('let entry = null;\n\n\t\t');
            }
            innerCode.push('\n\t\t// SET NEXT ENTRY CODE START\n\n\t\t');
            innerCode.push(setNextEntryCode.replace(/(?:\r\n|\r|\n)/g, '\n\t\t'));
            innerCode.push('\t// SET NEXT ENTRY CODE END\n');
            innerCode.push('\n\n\t\t', 'set', encodedTableName, '(entry, i', is2d ? ', j' : '', ', ', encodedTableName, ', ', logName, ', false);');
            innerCode.push('\n\n\t\t', 'set', encodedTableName, '(auxEntry, i', is2d ? ', j' : '', ', ', auxiliaryTableName, ', ', logName, ', true);');
            innerCode.push('\n\t\treturn entry;');
            innerCode.push('\n\t}');
            innerCode.push('\n}\n');
            innerCode.push('// RETURN VALUE CODE START\n\n');
            innerCode.push(solution.returnValueCode, '\n');
        }
        innerCode.push('// RETURN VALUE CODE END\n\n');
        innerCode.push('const resultSolution = {}\n\n');
        innerCode.push('resultSolution.result = result;\n');
        if (detailedSolution) {
            innerCode.push('resultSolution.solution = solution;\n');
        }
        innerCode.push('return resultSolution;', '\n');
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
        code.push(', ', encodedTableName, ', ', logName);
        code.push(', tableName) {\n');
        if (is2d) {
            code.push('\n\tif(i === null || i === undefined || ', encodedTableName, '.length <= i || i < 0) {');
            code.push('\n\t\tthrow new Error(\'Could not get entry: \' + i + \' is not a valid table row\');');
            code.push('\n\t}\n');
            code.push('\n\tif(i === null || i === undefined || ', encodedTableName, '[0].length <= j || j < 0) {');
            code.push('\n\t\tthrow new Error(\'Could not get entry: \' + j + \' is not a valid table column\');');
            code.push('\n\t}\n');
            code.push('\n\t', logName, '.push({"table": tableName, "action":"get","row":i,"column":j,"value":', encodedTableName, '[i][j]});\n');
        } else {
            code.push('\n\tif(i === null || i === undefined || ', encodedTableName, '.length <= i || i < 0) {');
            code.push('\n\t\tthrow new Error(\'Could not get entry: \' + i + \' is not a valid table index\');');
            code.push('\n\t}\n');
            code.push('\n\t', logName, '.push({"table": tableName, "action":"get","index":i,"value":', encodedTableName, '[i]});\n');
        }
        code.push('\n\treturn ', encodedTableName, '[i]');
        if (is2d) {
            code.push('[j]')
        }
        code.push(';\n};');
        return code.join('');
    }

    // Returns a function that gets from the table without altering UI
    static getPlainGetTableFunction(is2d: boolean, auxiliary: boolean): string {
        const code = [];
        const userFriendlyName = auxiliary ? 'T2' : 'T';

        code.push('const ', userFriendlyName, ' = function(i');
        if (is2d) {
            code.push(', j');
        }
        code.push(') {\n\treturn get', encodedTableName, '(i, ');
        if (is2d) {
            code.push('j, ')
        }
        code.push(auxiliary ? auxiliaryTableName : encodedTableName, ', ', logName, ', \'', userFriendlyName, '\');\n};'
        );
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
        code.push(', ', encodedTableName, ', ', logName);
        code.push(', auxiliary) {\n');
        if (is2d) {
            code.push('\n\tif(i === null || i === undefined || ', encodedTableName, '.length <= i || i < 0) {');
            code.push('\n\t\tthrow new Error(\'Could not set entry: \' + i + \' is not a valid table row\');');
            code.push('\n\t}\n');
            code.push('\n\tif(i === null || i === undefined || ', encodedTableName, '[0].length <= j || j < 0) {');
            code.push('\n\t\tthrow new Error(\'Could not set entry: \' + j + \' is not a valid table column\');');
            code.push('\n\t}\n')
        } else {
            code.push('\n\tif(i === null || i === undefined || ', encodedTableName, '.length <= i || i < 0) {');
            code.push('\n\t\tthrow new Error(\'Could not set entry: \' + i + \' is not a valid table index\');');
            code.push('\n\t}\n');
        }
        code.push('\n\t', encodedTableName, '[i]');
        if (is2d) {
            code.push('[j]')
        }
        code.push(' = val;\n');
        if (is2d) {
            code.push('\n\t', logName, '.push({"auxiliary": auxiliary, "action":"set","row":i,"column":j,"value":', encodedTableName, '[i][j]});\n');
        } else {
            code.push('\n\t', logName, '.push({"auxiliary": auxiliary, "action":"set","index":i,"value":', encodedTableName, '[i]});\n');
        }
        code.push('\n\n};');
        return code.join('');
    }

    transposeTable(): void {
        this.numExpectedTables = 0;
        this.numMatchingTableDimensions = 0;
        this.transpose2dTable = !this.transpose2dTable;
        for (let testCaseIndex = 0; testCaseIndex < this.testCases.length; testCaseIndex++) {
            const testCase = this.testCases[testCaseIndex];
            if (this.isRectangular2dArray(testCase['expected-table'])) {
                testCase['expected-table'] = this.getTransposedArray(testCase['expected-table']);
                // TODO: transpose expected-auxiliary-table, if it exists
                if (this.testResults[testCaseIndex]) {
                    this.testResults[testCaseIndex]['has-expected-table'] = this.isExpectedTable(testCase['expected-table'], this.testResults[testCaseIndex]['table'], this.approach === this.approaches[1], this);
                    if (this.testResults[testCaseIndex]['has-expected-table']) {
                        this.numExpectedTables++;
                    }

                    if (this.haveEqualDimensions(this.testResults[testCaseIndex]['table'], testCase['expected-table'])) {
                        this.numMatchingTableDimensions++;
                    }
                }
            }
        }
        // this.runAllTestsWithUserSolution()
    }

    openPopulateGivenSolutionDialog(): void {
        const component = this;
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            data: {
                'title': 'Are you sure?',
                'info': 'Showing the solution will overwrite the code you wrote',
                'cancelText': 'Go Back',
                'acceptText': 'Show Solution',
                'acceptColor': 'warn',
                'titleClass': 'text-red',
                'infoClass': ''
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                component.revealedProvidedSolution = true;
                // component.solution = Object.assign({}, component.providedSolution);
                // deep copy just in case solution format is changed in the future
                component.solution = JSON.parse(JSON.stringify(component.providedSolution));
                if (component.approach === component.approaches[1]) {
                    component.solution.setNextEntryCode = component.providedSolution.setNextEntryTopDownCode;
                    component.solution.returnValueCode = component.providedSolution.returnValueTopDownCode;
                }
                component.makeInputsResizable();
                component.runAllTestsWithUserSolution();
            }
        });
    }

    getSectionSpecificErrorMessage(e, code: string, isStack: boolean, isTopDown: boolean): string {
        // Note: e is either an error event (which means it's a syntax error) or an error object which means it's a runtime error)

        // Lines marking the code
        const tableInitStart = this.lineNumberOf('// TABLE INITIALIZATION CODE START', code);
        const tableInitEnd = this.lineNumberOf('// TABLE INITIALIZATION CODE END', code);
        const initCodeStart = this.lineNumberOf('// INITIALIZATION CODE START', code);
        const loopCodeStart = this.lineNumberOf('// LOOP CODE START', code);
        const defaultValueCodeStart = this.lineNumberOf('// DEFAULT VALUE CODE START', code);
        const nextEntryCodeStart = this.lineNumberOf('// SET NEXT ENTRY CODE START', code);
        const nextEntryCodeEnd = this.lineNumberOf('// SET NEXT ENTRY CODE END', code);
        const returnValueCodeStart = this.lineNumberOf('// RETURN VALUE CODE START', code);
        const returnValueCodeEnd = this.lineNumberOf('// RETURN VALUE CODE END', code);
        const functionCodeEnd = this.lineNumberOf('// FUNCTION CODE END', code);

        let errorLine; // Actual line in stack for which we want to specify error section
        let errorMessage;
        let errorZoneMessage;

        if (!isStack) {
            errorLine = e.lineno;
            errorMessage = e.message;
        } else {
            const stackSplit = e.toString().split('\n');
            errorMessage = stackSplit[0].substr(7);
            for (let i = stackSplit.length - 1; i >= 0; i--) {
                const stackline = stackSplit[i];
                if (stackline.indexOf('at algorithm ') >= 0) {
                    const lineSplit = stackline.split(':');
                    errorLine = Number(lineSplit[lineSplit.length - 2]);
                }
            }
        }

        if (!isTopDown) {
            if (errorLine <= tableInitEnd) {
                errorZoneMessage = 'Error in table initialization';
            } else if (errorLine <= loopCodeStart) {
                errorZoneMessage = 'Error in line ' + (errorLine - initCodeStart - 2) + ' of initialization code';
            } else if (errorLine <= defaultValueCodeStart) {
                errorZoneMessage = 'Error in for loop definition'
            } else if (errorLine <= nextEntryCodeStart) {
                errorZoneMessage = 'Error in setting default value for entry'
            } else if (errorLine <= nextEntryCodeEnd) {
                errorZoneMessage = 'Error in line ' + (errorLine - nextEntryCodeStart - 2) + ' of set next entry code';
            } else if (errorLine < returnValueCodeStart) {
                errorZoneMessage = 'Error in setting table value equal to entry';
            } else if (errorLine <= returnValueCodeEnd) {
                errorZoneMessage = 'Error in line ' + (errorLine - returnValueCodeStart - 2) + ' of return value code';
            } else {
                errorZoneMessage = 'Error while trying to return result'
            }
        } else {
            if (errorLine <= tableInitEnd) {
                errorZoneMessage = 'Error in table initialization';
            } else if (errorLine <= defaultValueCodeStart) {
                errorZoneMessage = 'Error in line ' + (errorLine - initCodeStart - 2) + ' of initialization code';
            } else if (errorLine <= nextEntryCodeStart) {
                errorZoneMessage = 'Error in setting default value for entry'
            } else if (errorLine <= nextEntryCodeEnd) {
                errorZoneMessage = 'Error in line ' + (errorLine - nextEntryCodeStart - 2) + ' of set next entry code';
            } else if (errorLine < returnValueCodeStart) {
                errorZoneMessage = 'Error in setting table value equal to entry';
            } else if (errorLine <= returnValueCodeEnd) {
                errorZoneMessage = 'Error in line ' + (errorLine - returnValueCodeStart - 2) + ' of return value code';
            } else {
                errorZoneMessage = 'Error while trying to return result'
            }
        }

        // Formatting error message here so we only have to return 1 value
        return ' ' + errorZoneMessage + '<br><br>' + errorMessage + (isTopDown ? '<br><br>Note that since the approach is top down the source of the error may be within another level of recursion' : '');

    }

    isArray(item: any): boolean {
        return item && item.constructor === Array;
    }

    shouldDisplayArray(item: any): boolean {
        if (this.isRectangular2dArray(item)) {
            return item.length > 0 && item[0].length > 0;
        } else {
            return item.length > 0;
        }
    }

    isRectangular2dArray(item: any): boolean {
        if (this.isArray(item) && item.constructor === Array && item.length > 0) {
            if (item[0].constructor !== Array) {
                return false;
            }
            for (let i = 1; i < item.length; i++) {
                if (item[i].constructor !== Array || item[i].length !== item[i - 1].length) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }

    isExpectedTable(target, provided, isTopDown: boolean, component: HomeComponent): boolean {
        // Note: isTopDown just means we're avoiding mismatches rather than matching everything
        if (!isTopDown) {
            return JSON.stringify(target) === JSON.stringify(provided);
        } else {
            if (component.haveEqualDimensions(target, provided)) {
                if (component.isRectangular2dArray(target)) {
                    for (let i = 0; i < target.length; i++) {
                        for (let j = 0; j < target[i].length; j++) {
                            if (provided[i][j] !== null && provided[i][j] !== undefined && provided[i][j] !== target[i][j]) {
                                return false;
                            }
                        }
                    }
                } else {
                    for (let i = 0; i < target.length; i++) {
                        if (provided[i] !== null && provided[i] !== undefined && provided[i] !== target[i]) {
                            return false;
                        }
                    }
                }
                return true;
            } else {
                return false;
            }
        }
    }

    haveEqualDimensions(table1: any, table2: any): boolean {
        if (!this.isArray(table1) || !this.isArray(table1)) {
            return false;
        } else if (!this.isRectangular2dArray(table1) && !this.isRectangular2dArray(table1)) {
            return table1.length === table2.length;
        } else if (!this.isRectangular2dArray(table1) || !this.isRectangular2dArray(table1)) {
            return false;
        } else {
            return table1.length === table2.length && table1[0].length === table2[0].length;
        }
    }


    raiseProvidedSolutionError(message: string) {
        alert('It looks like there was en error with the provided solution for ' +
            this.problemFileName
            + ':\n\n'
            + message
            + '\n\nPlease close this page. If this issue persists, please contact the problem author');
    }

    // Assumes input is 2d table
    getTransposedArray(input): any {
        return input[0].map((x, i) => input.map(x => x[i]));
    }

    getTableDimensions(input): string {
        if (!this.isArray(input)) {
            return 'Not an array';
        }
        if (this.isRectangular2dArray(input)) {
            return '' + input.length + ' x ' + input[0].length;
        } else {
            return '' + input.length;
        }
    }

    getDisplayedValue(value: any): string {
        if (value === null || value === undefined) {
            return 'null';
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
        } else if ((typeof value) === (typeof 'string')) {
            return value;
        } else {
            return JSON.stringify(value);
        }
    }

    lineNumberOf(needle: string, haystack: string) {
        const haystackSplit = haystack.split('\n');
        for (let i = 0; i < haystackSplit.length; i++) {
            const line = haystackSplit[i];
            if (line.indexOf(needle) >= 0) {
                return i;
            }
        }
        return -1;
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

    camelCase(str: string) {
        return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
            if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
            return index == 0 ? match.toLowerCase() : match.toUpperCase();
        });
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
