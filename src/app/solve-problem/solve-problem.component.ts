import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {MatDialog} from "@angular/material";
import {ConfirmationDialogComponent} from "../dialogs/confirmation-dialog/confirmation-dialog.component";
import {ActivatedRoute, Router} from "@angular/router";
import {Title} from "@angular/platform-browser";
import {CustomProblemService} from "../providers/custom-problem.service";

const encodedTableName = '___TABLE___';
const auxiliaryTableName = '___AUX_TABLE___';
const logName = '___LOG___';

declare let CodeMirror: any;

@Component({
    selector: 'app-solve-problem',
    templateUrl: './solve-problem.component.html',
    styleUrls: ['./solve-problem.component.css']
})
export class SolveProblemComponent implements OnInit {

    objectKeys = Object.keys;

    // Maps textareas to the variables they correspond to
    textAreaVariableMap: any = {
        'initialization-textarea': 'initializationCode',
        'top-down-initialization-textarea': 'initializationCode',
        'set-next-entry-textarea': 'setNextEntryCode',
        'top-down-set-next-entry-textarea': 'setNextEntryCode',
        'return-value-textarea': 'returnValueCode'
    };
    codeMirrorMap = {};

    problemFileName: string;

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
    };

    generatedCode: string = null;

    testResults: any = {};

    testTimeLimit = 3000; // Time limit in milliseconds per test

    transpose2dTable: boolean = false;

    revealedProvidedSolution: boolean = false;

    numRunTestCases: number = 0;
    numCorrectFinalAnswerTestCases: number = 0;
    numIncorrectFinalAnswerTestCases: number = 0;
    numCrashedTestCases: number = 0;
    numTimedOutTestCases: number = 0;
    numExpectedTables: number = 0;
    numMatchingTableDimensions: number = 0;
    numCorrectSolutions: number = 0;
    numIncorrectSolutions: number = 0;
    numExpectedAuxiliaryTables: number = 0;
    testsCurrentlyRunning: boolean = false;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private http: HttpClient,
                private titleService: Title,
                public dialog: MatDialog,
                private customProblemService: CustomProblemService
    ) {
    }

    ngOnInit() {
        const component: SolveProblemComponent = this;
        component.route.params.subscribe(params => {
            const problemFileName = params['problem-name'];
            if (problemFileName === 'custom') {
                if (component.customProblemService.customProblemExists()) {
                    component.setProblem(component, component.customProblemService.popCustomProblem());
                } else {
                    component.router.navigate(['select-problem']);
                }
            } else {
                component.problemFileName = problemFileName;
                component.loadProblem(component.problemFileName, component);
                component.makeInputsResizable(component);
            }
        });
        component.initializeEditors();

    }

    initializeEditors(): void {
        const options = {
            lineNumbers: true,
            mode: 'javascript',
            theme: 'default',
            viewportMargin: Infinity,
            indentWithTabs: true,
            tabSize: 4
        };
        const textEditorIDs = this.objectKeys(this.textAreaVariableMap);
        for (let i = 0; i < textEditorIDs.length; i++) {
            let id = textEditorIDs[i];
            const textArea = document.getElementById(id);
            this.codeMirrorMap[id] = CodeMirror.fromTextArea(textArea, options);
        }
        this.populateCodeEditors();
    }

    populateCodeEditors(): void {
        const textEditorIDs = this.objectKeys(this.textAreaVariableMap);
        for (let i = 0; i < textEditorIDs.length; i++) {
            const id = textEditorIDs[i];
            const variable = this.textAreaVariableMap[id];
            this.codeMirrorMap[id].setValue(this.solution[variable]);
        }
    }

    getCodeFromEditors(): void {
        // top down
        if (this.approach === this.approaches[1]) {
            this.solution.initializationCode = this.codeMirrorMap['top-down-initialization-textarea'].getValue();
            this.solution.setNextEntryCode = this.codeMirrorMap['top-down-set-next-entry-textarea'].getValue();
        } else {
            this.solution.initializationCode = this.codeMirrorMap['initialization-textarea'].getValue();
            this.solution.setNextEntryCode = this.codeMirrorMap['set-next-entry-textarea'].getValue();
        }
        this.solution.returnValueCode = this.codeMirrorMap['return-value-textarea'].getValue();
    }

    makeEditorCodeEqual(approach: string) {
        let from = ['initialization-textarea', 'set-next-entry-textarea'];
        let to = ['top-down-initialization-textarea', 'top-down-set-next-entry-textarea'];
        if (approach === this.approaches[0]) {
            let temp = from;
            from = to;
            to = temp;
        }
        for (let i = 0; i < from.length; i++) {
            const copyValue = this.codeMirrorMap[from[i]].getValue();
            const toCodeMirror = this.codeMirrorMap[to[i]];
            toCodeMirror.setValue(copyValue);
            setTimeout(function () {
                toCodeMirror.refresh();
            }, 1);
        }
    }


    makeInputsResizable(component: SolveProblemComponent) {
        const smallInputFields = document.getElementsByClassName('input-field-small');
        for (let i = 0; i < smallInputFields.length; i++) {
            const el = smallInputFields[i];
            component.makeResizable(el, 7.5);
        }
    }

    loadProblem(problemFileName: string, component: SolveProblemComponent): void {
        component.http.get('../assets/problems/' + problemFileName + '.dp.json').subscribe(data => {
            this.setProblem(component, data);
        }, _ => {
            component.router.navigate(['select-problem']);
        });
    }

    private setProblem(component: SolveProblemComponent, data) {
        console.log(data);
        component.problem = data;
        component.providedSolution = component.problem['provided-solution'];
        component.testCases = component.problem['test-cases'];
        component.problemDefined = true;
        component.titleService.setTitle(component.problem.name);
        component.recalculateExpectedResults();
    }

    recalculateExpectedResults() {
        const component = this;
        // We're always calculating the detailed solution if we're using the provided solution
        const code = SolveProblemComponent.getPlainRunnableCode(
            component.providedSolution,
            component.problem,
            false,
            component.providedSolution.detailedSetNextEntryCode,
            component.providedSolution.detailedSetNextEntryCode && component.providedSolution.useAuxiliaryTableWithDetailedSolution);
        component.testsCurrentlyRunning = true;
        component.runTestsWithProvidedSolution(component, 0, code);

    }

    runTestsWithProvidedSolution(component: SolveProblemComponent, testCaseIndex: number, code: string): void {
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
                        testCase['log'] = testResult['log'];
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
    runTest(testCaseIndex: number,
            plainFunctionCode: string,
            component: SolveProblemComponent,
            isTopDown: boolean,
            detailedSolution: boolean,
            auxiliaryTable: boolean,
            callback: Function) {
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
        // console.log(joinedCode);

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
        this.getCodeFromEditors();
        this.numRunTestCases = 0;
        this.numCorrectFinalAnswerTestCases = 0;
        this.numIncorrectFinalAnswerTestCases = 0;
        this.numCrashedTestCases = 0;
        this.numTimedOutTestCases = 0;
        this.numExpectedTables = 0;
        this.numMatchingTableDimensions = 0;
        this.numCorrectSolutions = 0;
        this.numIncorrectSolutions = 0;
        this.numExpectedAuxiliaryTables = 0;
        this.testsCurrentlyRunning = true;
        const code = SolveProblemComponent.getPlainRunnableCode(this.solution, this.problem, this.approach === this.approaches[1], this.expectDetailedSolution, this.expectDetailedSolution && this.providedSolution.useAuxiliaryTableWithDetailedSolution);
        this.generatedCode = code
            .replace(new RegExp('\t', 'g'), '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(new RegExp(' {4}', 'g'), '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(new RegExp('\n', 'g'), '<br>');
        this.runTestsWithUserSolution(this, 0, code);
    }

    runTestsWithUserSolution(component: SolveProblemComponent, testCaseIndex: number, code: string) {
        if (testCaseIndex < component.testCases.length) {
            let topDown = component.approach === component.approaches[1];
            let useDetailedSolution = component.expectDetailedSolution;
            let useAuxiliaryTable = useDetailedSolution && component.providedSolution.useAuxiliaryTableWithDetailedSolution;
            component.runTest(testCaseIndex, code, component, topDown, useDetailedSolution, useAuxiliaryTable, function (testResult) {
                let testCase = component.testCases[testCaseIndex];
                const expectedTable = testCase['expected-table'];
                testResult['has-expected-table'] = !testResult['error'] && !testResult['timed-out'] && component.isExpectedTable(expectedTable, testResult['table'], component.approach === component.approaches[1], component);
                if (useDetailedSolution) {
                    testResult['has-expected-solution'] = !testResult['error'] && !testResult['timed-out'] && component.deepEquals(testCase['expected-solution'], testResult['solution']);
                    if (component.providedSolution.useAuxiliaryTableWithDetailedSolution) {
                        testResult['has-expected-auxiliary-table'] = !testResult['error'] && !testResult['timed-out'] && component.isExpectedTable(testCase['expected-auxiliary-table'], testResult['auxiliary-table'], component.approach === component.approaches[1], component);
                    }
                }
                component.testResults[testCaseIndex] = testResult;
                component.numRunTestCases++;
                if (testResult['result'] === testCase['expected-result']) {
                    component.numCorrectFinalAnswerTestCases++;
                } else if (!testResult['error'] && !testResult['timed-out']) {
                    component.numIncorrectFinalAnswerTestCases++;
                }
                if (useDetailedSolution) {
                    if (testResult['has-expected-solution']) {
                        component.numCorrectSolutions++;
                    } else if (!testResult['error'] && !testResult['timed-out']) {
                        component.numIncorrectSolutions++;
                    }
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
                if (testResult['has-expected-auxiliary-table']) {
                    component.numExpectedAuxiliaryTables++;
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
                initializationCode.push('for (let TABLE__INDEX = 0; TABLE__INDEX < ', solution.tableDimension1, '; TABLE__INDEX++) {\n');
                initializationCode.push('\t', auxiliaryTableName, '.push(Array(', solution.tableDimension2, '));\n');
                initializationCode.push('}');
            } else {
                initializationCode.push('const ',
                    auxiliaryTableName,
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
            SolveProblemComponent.getWrappedGetTableFunction(is2d),
            '\n\n',
            SolveProblemComponent.getPlainGetTableFunction(is2d, false),
            '\n\n',
            (auxiliaryTable ? SolveProblemComponent.getPlainGetTableFunction(is2d, true) + '\n\n' : ''),
            SolveProblemComponent.getPlainSetTableFunction(is2d),
            '\n\n',
            SolveProblemComponent.getAlgorithmCode(solution, problem, useTopDown, detailedSolution, auxiliaryTable)
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

            const setNextEntryCode = solution.detailedSetNextEntryCode || solution.setNextEntryCode;
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
            innerCode.push('\n\t// SET NEXT ENTRY CODE END\n');
            innerCode.push('\n\n\t', is2d ? '\t' : '', 'set', encodedTableName, '(entry, ', solution.nextEntryIndex1);
            if (is2d) {
                innerCode.push(', ', solution.nextEntryIndex2);
            }
            innerCode.push(', ', encodedTableName, ', ', logName, ', \'T\');\n');
            if (auxiliaryTable) {
                innerCode.push('\n\n\t', is2d ? '\t' : '', 'set', encodedTableName, '(secondaryEntry, ', solution.nextEntryIndex1);
                if (is2d) {
                    innerCode.push(', ', solution.nextEntryIndex2);
                }
                innerCode.push(', ', auxiliaryTableName, ', ', logName, ', \'T2\');\n');
            }
            if (is2d) {
                innerCode.push('\t}\n\n');
            }
            innerCode.push('}\n\n');
            innerCode.push('// RETURN VALUE CODE START\n\n');
            innerCode.push(solution.detailedReturnValueCode || solution.returnValueCode, '\n');
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
            innerCode.push('\n\t// SET NEXT ENTRY CODE END\n');
            innerCode.push('\n\n\t\t', 'set', encodedTableName, '(entry, i', is2d ? ', j' : '', ', ', encodedTableName, ', ', logName, ', \'T\');');
            if (auxiliaryTable) {
                innerCode.push('\n\n\t\t', 'set', encodedTableName, '(secondaryEntry, i', is2d ? ', j' : '', ', ', auxiliaryTableName, ', ', logName, ', \'T2\');');
            }
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
            code.push('\n\t\tthrow new Error(\'Could not get entry: \' + i + \' is not a valid table dimension 1 index\');');
            code.push('\n\t}\n');
            code.push('\n\tif(i === null || i === undefined || ', encodedTableName, '[0].length <= j || j < 0) {');
            code.push('\n\t\tthrow new Error(\'Could not get entry: \' + j + \' is not a valid table dimension 2 index\');');
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
        code.push(', tableName) {\n');
        if (is2d) {
            code.push('\n\tif(i === null || i === undefined || ', encodedTableName, '.length <= i || i < 0) {');
            code.push('\n\t\tthrow new Error(\'Could not set entry: \' + i + \' is not a valid table dimension 1 index\');');
            code.push('\n\t}\n');
            code.push('\n\tif(i === null || i === undefined || ', encodedTableName, '[0].length <= j || j < 0) {');
            code.push('\n\t\tthrow new Error(\'Could not set entry: \' + j + \' is not a valid table dimension 2 index\');');
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
            code.push('\n\t', logName, '.push({"table": tableName, "action":"set","row":i,"column":j,"value":', encodedTableName, '[i][j]});\n');
        } else {
            code.push('\n\t', logName, '.push({"table": tableName, "action":"set","index":i,"value":', encodedTableName, '[i]});\n');
        }
        code.push('\n\n};');
        return code.join('');
    }

    transposeTable(): void {
        this.numExpectedTables = 0;
        this.numMatchingTableDimensions = 0;
        this.numExpectedAuxiliaryTables = 0;
        this.transpose2dTable = !this.transpose2dTable;
        for (let testCaseIndex = 0; testCaseIndex < this.testCases.length; testCaseIndex++) {
            const testCase = this.testCases[testCaseIndex];
            if (this.isRectangular2dArray(testCase['expected-table'])) {
                testCase['expected-table'] = this.getTransposedArray(testCase['expected-table']);
                if (this.testResults[testCaseIndex]) {
                    this.testResults[testCaseIndex]['has-expected-table'] = this.isExpectedTable(testCase['expected-table'], this.testResults[testCaseIndex]['table'], this.approach === this.approaches[1], this);
                    if (this.testResults[testCaseIndex]['has-expected-table']) {
                        this.numExpectedTables++;
                    }

                    if (this.haveEqualDimensions(this.testResults[testCaseIndex]['table'], testCase['expected-table'])) {
                        this.numMatchingTableDimensions++;
                    }

                    if (this.expectDetailedSolution && this.providedSolution.useAuxiliaryTableWithDetailedSolution) {
                        testCase['expected-auxiliary-table'] = this.getTransposedArray(testCase['expected-auxiliary-table']);
                        this.testResults[testCaseIndex]['has-expected-auxiliary-table'] = this.isExpectedTable(testCase['expected-auxiliary-table'], this.testResults[testCaseIndex]['auxiliary-table'], this.approach === this.approaches[1], this);
                        if (this.testResults[testCaseIndex]['has-expected-auxiliary-table']) {
                            this.numExpectedAuxiliaryTables++;
                        }
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
                component.solution.detailedSetNextEntryTopDownCode = null;
                component.solution.detailedReturnValueTopDownCode = null;
                component.solution.setNextEntryTopDownCode = null;
                component.solution.returnValueTopDownCode = null;
                component.solution.detailedSetNextEntryCode = null;
                component.solution.detailedReturnValueCode = null;

                if (component.approach === component.approaches[1]) {
                    if (component.expectDetailedSolution) {
                        component.solution.setNextEntryCode = component.providedSolution.detailedSetNextEntryTopDownCode;
                        component.solution.returnValueCode = component.providedSolution.detailedReturnValueTopDownCode;
                    } else {
                        component.solution.setNextEntryCode = component.providedSolution.setNextEntryTopDownCode;
                        component.solution.returnValueCode = component.providedSolution.returnValueTopDownCode;
                    }
                } else {
                    if (component.expectDetailedSolution) {
                        component.solution.setNextEntryCode = component.providedSolution.detailedSetNextEntryCode;
                        component.solution.returnValueCode = component.providedSolution.detailedReturnValueCode;
                    } else {
                        component.solution.setNextEntryCode = component.providedSolution.setNextEntryCode;
                        component.solution.returnValueCode = component.providedSolution.returnValueCode;
                    }
                }
                component.makeInputsResizable(component);
                component.populateCodeEditors();
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
            stackSplit.reverse();
            for (let i = 0; i < stackSplit.length; i++) {
                const stackline = stackSplit[i];
                if (stackline.indexOf('at algorithm ') >= 0 || stackline.indexOf('at getTableEntry ') >= 0) {
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
        return ' ' + errorZoneMessage + '<br><br>' + errorMessage;

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

    isExpectedTable(target, provided, isTopDown: boolean, component: SolveProblemComponent): boolean {
        // Note: isTopDown just means we're avoiding mismatches rather than matching everything
        if (!isTopDown) {
            return this.deepEquals(target, provided);
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
            + '\n\nPlease close or refresh this page. If this issue persists, please contact the problem author');
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

    deepEquals(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
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
