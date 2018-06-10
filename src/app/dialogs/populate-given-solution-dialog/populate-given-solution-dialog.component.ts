import {Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

@Component({
    selector: 'app-populate-given-solution-dialog',
    templateUrl: './populate-given-solution-dialog.component.html'
})
export class PopulateGivenSolutionDialogComponent {

    constructor(
        public dialogRef: MatDialogRef<PopulateGivenSolutionDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
