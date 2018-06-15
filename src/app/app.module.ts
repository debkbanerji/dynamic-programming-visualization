import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import 'hammerjs';

import {AppComponent} from './app.component';
import {HomeComponent} from './home/home.component';
import {RouterModule, Routes} from "@angular/router";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {FormsModule} from "@angular/forms";
import {
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatTabsModule, MatProgressBarModule
} from "@angular/material";
import {HttpClientModule} from "@angular/common/http";
import {ConfirmationDialogComponent} from './dialogs/confirmation-dialog/confirmation-dialog.component';

const routes: Routes = [ // Array of all routes - modify when adding routes
    {path: '**', component: HomeComponent} // Default route
];


@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        ConfirmationDialogComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatSelectModule,
        MatExpansionModule,
        MatTabsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDialogModule,
        MatProgressBarModule,
        RouterModule.forRoot(routes)
    ],
    entryComponents: [
        ConfirmationDialogComponent
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
