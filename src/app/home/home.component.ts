import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    tableSizes: Array<string> = ['1d', '2d'];
    tableSize = this.tableSizes[1];

    constructor() {
    }

    ngOnInit() {
    }

}
