import {Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {AnimationDataService} from "../../providers/animation-data.service";

@Component({
    selector: 'app-animation-dialog',
    templateUrl: './animation-dialog.component.html',
    styleUrls: ['./animation-dialog.component.css']
})
export class AnimationDialogComponent {

    isDarkTheme: boolean;
    title: string;

    constructor(
        public dialogRef: MatDialogRef<AnimationDialogComponent>,
        public animationDataService: AnimationDataService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.isDarkTheme = data.isDarkTheme;
        this.title = animationDataService.title;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
