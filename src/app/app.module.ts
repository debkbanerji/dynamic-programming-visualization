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
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTabsModule
} from "@angular/material";
import {HttpClientModule} from "@angular/common/http";

const routes: Routes = [ // Array of all routes - modify when adding routes
    {path: '**', component: HomeComponent} // Default route
];


@NgModule({
    declarations: [
        AppComponent,
        HomeComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatSelectModule,
        MatExpansionModule,
        MatTabsModule,
        MatButtonModule,
        RouterModule.forRoot(routes)
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
