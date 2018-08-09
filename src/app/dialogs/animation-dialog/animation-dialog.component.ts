import {Component, Inject, OnInit} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {AnimationDataService} from "../../providers/animation-data.service";

@Component({
    selector: 'app-animation-dialog',
    templateUrl: './animation-dialog.component.html',
    styleUrls: ['./animation-dialog.component.css']
})
export class AnimationDialogComponent implements OnInit {

    isDarkTheme: boolean;
    title: string;
    result;
    log;
    mainTableDimension1: number;
    mainTableDimension2: number;

    currentMainTable: any;
    isMainTable2d: boolean;

    totalGets: number;
    totalSets: number;

    currentFrame: number;
    totalFrames: number;
    isCurrentlyPlayingAnimation: boolean = false;
    currentlyPlayingIntervalVariable: any = null;
    playIntervalTimeMS: number = 250;
    currentlySwitchingPlayState: boolean = false;

    lastAffectedIndex1: number = -1;
    lastAffectedIndex2: number = -1;
    lastOperation: string = null;

    constructor(
        public dialogRef: MatDialogRef<AnimationDialogComponent>,
        public animationDataService: AnimationDataService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    ngOnInit() {
        this.isDarkTheme = this.data.isDarkTheme;
        this.title = this.animationDataService.title;
        this.result = this.animationDataService.result;
        this.log = this.animationDataService.log;
        this.mainTableDimension1 = this.animationDataService.mainTableDimension1;
        this.mainTableDimension2 = this.animationDataService.mainTableDimension2;
        this.isMainTable2d = this.mainTableDimension2 >= 0;
        this.resetMainTable();
        this.currentFrame = 0;
        this.totalFrames = this.log.length + 1;
        this.totalGets = 0;
        this.totalSets = 0;
        for (let i = 0; i < this.log.length; i++) {
            const entry = this.log[i];
            if (entry.action === 'set') {
                this.totalSets++;
            } else if (entry.action === 'get') {
                this.totalGets++;
            }
        }
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

    resetAnimation(): void{
        this.currentFrame = 0;
        this.resetMainTable();
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
            this.lastOperation = lastOperationEntry.action;
            this.lastAffectedIndex1 = lastOperationEntry.index1;
            this.lastAffectedIndex2 = lastOperationEntry.index2;
        } else {
            this.lastAffectedIndex1 = -1;
            this.lastAffectedIndex2 = -1;
            this.lastOperation = null;
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
        } else {
            this.lastAffectedIndex1 = -1;
            this.lastAffectedIndex2 = -1;
            this.lastOperation = null;
        }
        this.currentFrame++;
    }

    canStepBackward(): boolean {
        return this.currentFrame > 0;
    }

    canStepForward(): boolean {
        return this.currentFrame < this.totalFrames;
    }

    getRelevantTable(logEntry) {
        if (logEntry.table === 'T') {
            return this.currentMainTable;
        }
    }

    getTableCell(table, i, j) {
        let is2d;
        if (table === this.currentMainTable) {
            is2d = this.isMainTable2d;
        }
        if (!is2d) {
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

    resetMainTable() {
        this.currentMainTable = [];
        if (this.isMainTable2d) {
            for (let i = 0; i < this.mainTableDimension1; i++) {
                let nextArray = [];
                for (let i = 0; i < this.mainTableDimension2; i++) {
                    nextArray.push([]);
                }
                this.currentMainTable.push(nextArray);
            }
        } else {
            for (let i = 0; i < this.mainTableDimension1; i++) {
                this.currentMainTable.push([]);
            }
        }
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
