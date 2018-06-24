import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";

@Component({
    selector: 'app-select-problem',
    templateUrl: './select-problem.component.html',
    styleUrls: ['./select-problem.component.css']
})
export class SelectProblemComponent implements OnInit {

    // Register any new problems within the appropriate section
    sections = [
        {
            name: 'Knapsack',
            problems: [
                {
                    name: 'Knapsack Without Repetition',
                    id: 'knapsack-without-repetition'
                }
            ]
        }
    ];


    constructor(private router: Router) {
    }

    ngOnInit() {
    }

    openProblem(id: string): void {
        console.log(id);
        this.router.navigate(['problem/' + id]);
    }

}
