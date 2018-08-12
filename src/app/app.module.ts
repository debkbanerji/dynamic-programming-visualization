import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import 'hammerjs';

import {AppComponent} from './app.component';
import {SolveProblemComponent} from './solve-problem/solve-problem.component';
import {RouterModule, Routes} from '@angular/router';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule} from '@angular/forms';
import {
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatTabsModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatTooltipModule
} from '@angular/material';
import {HttpClientModule} from '@angular/common/http';
import {ConfirmationDialogComponent} from './dialogs/confirmation-dialog/confirmation-dialog.component';
import {SelectProblemComponent} from './select-problem/select-problem.component';
import {AnimationDialogComponent} from './dialogs/animation-dialog/animation-dialog.component';

const routes: Routes = [
    {path: 'problem/:problem-name', component: SolveProblemComponent},
    {path: 'select-problem', component: SelectProblemComponent},
    {path: '**', redirectTo: 'select-problem', pathMatch: 'full'} // Default route
];


@NgModule({
    declarations: [
        AppComponent,
        SolveProblemComponent,
        ConfirmationDialogComponent,
        AnimationDialogComponent,
        SelectProblemComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatExpansionModule,
        MatTabsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatSlideToggleModule,
        MatDialogModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        RouterModule.forRoot(routes)
    ],
    entryComponents: [
        ConfirmationDialogComponent,
        AnimationDialogComponent
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
