import {Component, Inject, OnInit} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {AnimationDataService} from "../../providers/animation-data.service";

@Component({
    selector: 'app-animation-dialog',
    templateUrl: './animation-dialog.component.html',
    styleUrls: ['./animation-dialog.component.css']
})
export class AnimationDialogComponent implements OnInit {

    objectKeys = Object.keys;

    isDarkTheme: boolean;
    title: string;
    subtitle: string;
    result;
    solution;
    showSolution: boolean;
    input;
    log;
    useAuxiliaryTable: boolean;
    tableDimension1: number;
    tableDimension2: number;

    currentMainTable: any;
    currentAuxiliaryTable: any;
    isTable2d: boolean;

    totalGets: number;
    totalSets: number;
    mainTableGets: number;
    mainTableSets: number;
    auxiliaryTableGets: number;
    auxiliaryTableSets: number;

    currentFrame: number;
    totalFrames: number;
    isCurrentlyPlayingAnimation: boolean = false;
    currentlyPlayingIntervalVariable: any = null;
    currentlySwitchingPlayState: boolean = false;

    playIntervalTimeMSOptions = [
        {text: 'Slower', value: 750},
        {text: 'Slow', value: 300},
        {text: 'Medium', value: 180},
        {text: 'Fast', value: 80},
        {text: 'Faster', value: 25},
        {text: '&#x1F5F2;', value: 2}
    ];
    playIntervalTimeMS: number = this.playIntervalTimeMSOptions[2].value;

    numSkipSections: number = 8;
    skipFrames = [];

    lastAffectedIndex1: number = -1;
    lastAffectedIndex2: number = -1;
    lastOperation: string = null;
    lastAffectedTable: string = null;

    constructor(
        public dialogRef: MatDialogRef<AnimationDialogComponent>,
        public animationDataService: AnimationDataService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    ngOnInit() {
        this.isDarkTheme = this.data.isDarkTheme;
        this.title = this.animationDataService.title;
        this.subtitle = this.animationDataService.subtitle;
        this.result = this.animationDataService.result;
        this.solution = this.animationDataService.solution;
        this.showSolution = !!this.solution || this.solution === 0;
        this.input = this.animationDataService.input;
        this.log = this.animationDataService.log;
        this.useAuxiliaryTable = this.animationDataService.useAuxiliaryTable;
        this.tableDimension1 = this.animationDataService.mainTableDimension1;
        this.tableDimension2 = this.animationDataService.mainTableDimension2;
        this.isTable2d = this.tableDimension2 >= 0;
        this.resetTables();
        this.currentFrame = 0;
        this.totalFrames = this.log.length + 1;
        this.totalGets = 0;
        this.totalSets = 0;
        this.mainTableGets = 0;
        this.mainTableSets = 0;
        this.auxiliaryTableGets = 0;
        this.auxiliaryTableSets = 0;
        for (let i = 0; i < this.log.length; i++) {
            const entry = this.log[i];
            if (entry.action === 'set') {
                this.totalSets++;
                if (this.getRelevantTable(entry) === this.currentMainTable) {
                    this.mainTableSets++
                } else {
                    this.auxiliaryTableSets++;
                }
            } else if (entry.action === 'get') {
                this.totalGets++;
                if (this.getRelevantTable(entry) === this.currentMainTable) {
                    this.mainTableGets++
                } else {
                    this.auxiliaryTableGets++;
                }
            }
        }

        const skipSectionLength = this.totalFrames / this.numSkipSections;
        for (let i = 0; i < this.numSkipSections; i++) {
            this.skipFrames.push(Math.round(i * skipSectionLength));
        }
        this.skipFrames.push(this.totalFrames);
    }

    playAnimation(): void {
        const component = this;
        component.isCurrentlyPlayingAnimation = true;
        component.currentlySwitchingPlayState = false;
        component.currentlyPlayingIntervalVariable = setInterval(function () {
            if (component.isCurrentlyPlayingAnimation) {
                if (component.canStepForward()) {
                    component.stepForward();
                } else {
                    component.stopPlayingAnimation();
                }
            }
        }, component.playIntervalTimeMS);
    }

    resetAnimation(): void {
        this.currentFrame = 0;
        this.resetTables();
    }

    stopPlayingAnimation(): void {
        const component = this;
        component.isCurrentlyPlayingAnimation = false;
        component.currentlySwitchingPlayState = true;
        if (component.currentlyPlayingIntervalVariable) {
            clearInterval(component.currentlyPlayingIntervalVariable);
            component.currentlyPlayingIntervalVariable = null;
        }
        setTimeout(function () {
            component.currentlySwitchingPlayState = false;
        }, component.playIntervalTimeMS + 10)
    }

    stepBackward(): void {
        if (this.currentFrame <= this.log.length) {
            const entry = this.log[this.currentFrame - 1];
            const table = this.getRelevantTable(entry);
            const cell = this.getTableCell(table, entry.index1, entry.index2);
            if (entry.action == 'set') {
                cell.pop();
            }
        }
        const lastOperationFrame = this.currentFrame - 2;
        if (lastOperationFrame >= 0 && lastOperationFrame < this.log.length) {
            const lastOperationEntry = this.log[lastOperationFrame];
            this.lastAffectedIndex1 = lastOperationEntry.index1;
            this.lastAffectedIndex2 = lastOperationEntry.index2;
            this.lastOperation = lastOperationEntry.action;
            this.lastAffectedTable = this.getRelevantTable(lastOperationEntry);
        } else {
            this.lastAffectedIndex1 = -1;
            this.lastAffectedIndex2 = -1;
            this.lastOperation = null;
            this.lastAffectedTable = null;
        }
        this.currentFrame--;
    }

    stepForward(): void {
        if (this.currentFrame < this.log.length) {
            const entry = this.log[this.currentFrame];
            const table = this.getRelevantTable(entry);
            const cell = this.getTableCell(table, entry.index1, entry.index2);
            if (entry.action == 'set') {
                cell.push(entry.value)
            }
            this.lastOperation = entry.action;
            this.lastAffectedIndex1 = entry.index1;
            this.lastAffectedIndex2 = entry.index2;
            this.lastAffectedTable = table;
        } else {
            this.lastAffectedIndex1 = -1;
            this.lastAffectedIndex2 = -1;
            this.lastOperation = null;
            this.lastAffectedTable = null;
        }
        this.currentFrame++;
    }

    canStepBackward(): boolean {
        return this.currentFrame > 0;
    }

    canStepForward(): boolean {
        return this.currentFrame < this.totalFrames;
    }

    skipForward() {
        this.stepForward();
        while (this.canStepForward() && this.skipFrames.indexOf(this.currentFrame) < 0) {
            this.stepForward();
        }
    }

    skipBackward() {
        this.stepBackward();
        while (this.canStepBackward() && this.skipFrames.indexOf(this.currentFrame) < 0) {
            this.stepBackward();
        }
    }

    getRelevantTable(logEntry) {
        if (logEntry.table === 'T') {
            return this.currentMainTable;
        } else if (logEntry.table === 'T2') {
            return this.currentAuxiliaryTable;
        }
    }

    getTableCell(table, i, j) {
        if (!this.isTable2d) {
            return table[i];
        } else {
            return table[i][j];
        }
    }

    getTableDisplayedValue(table, i, j) {
        let targetCellArray;
        if (j < 0) {
            targetCellArray = table[i];
        } else {
            targetCellArray = table[i][j];
        }
        if (targetCellArray.length === 0) {
            return '';
        } else {
            return this.getDisplayedValue(targetCellArray[targetCellArray.length - 1]);
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
        if (this.isArray(item) && item.constructor === Array && item.length > 0 && item[0]) {
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

    resetTables() {
        this.currentMainTable = [];
        this.currentAuxiliaryTable = [];
        [this.currentMainTable, this.currentAuxiliaryTable].forEach(table => {
            if (this.isTable2d) {
                for (let i = 0; i < this.tableDimension1; i++) {
                    let nextArray = [];
                    for (let i = 0; i < this.tableDimension2; i++) {
                        nextArray.push([]);
                    }
                    table.push(nextArray);
                }
            } else {
                for (let i = 0; i < this.tableDimension1; i++) {
                    table.push([]);
                }
            }
        });
    }

    onNoClick(): void {
        this.dialogRef.close();
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
