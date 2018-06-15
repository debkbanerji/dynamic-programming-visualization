import {Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

@Component({
    selector: 'app-confirmation-solution-dialog',
    templateUrl: './confirmation-dialog.component.html'
})
export class ConfirmationDialogComponent {

    constructor(
        public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        console.log(data);
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
