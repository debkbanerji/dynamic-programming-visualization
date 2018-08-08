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

    constructor(
        public dialogRef: MatDialogRef<AnimationDialogComponent>,
        public animationDataService: AnimationDataService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.isDarkTheme = data.isDarkTheme;
        this.title = animationDataService.title;
        this.result = animationDataService.result;
        this.log = animationDataService.log;
        this.mainTableDimension1 = animationDataService.mainTableDimension1;
        this.mainTableDimension2 = animationDataService.mainTableDimension2;
    }


    ngOnInit() {
        this.isMainTable2d = this.mainTableDimension2 >= 0;
        this.resetMainTable();
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
