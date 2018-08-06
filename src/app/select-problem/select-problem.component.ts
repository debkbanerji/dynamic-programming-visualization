import {Component, Inject, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {CustomProblemService} from "../providers/custom-problem.service";
import {DOCUMENT} from "@angular/common";

@Component({
    selector: 'app-select-problem',
    templateUrl: './select-problem.component.html',
    styleUrls: ['./select-problem.component.css']
})
export class SelectProblemComponent implements OnInit {

    expectCustomProblem: boolean = false;
    customProblemFile: any;
    customProblemErrorText: string;

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


    constructor(
        private router: Router,
        private customProblemService: CustomProblemService,
        @Inject(DOCUMENT) document
    ) {
    }

    ngOnInit() {
    }

    openProblem(id: string): void {
        this.router.navigate(['problem/' + id]);
    }

    solveCustomProblem(): void {
        const component: SelectProblemComponent = this;
        const problemFileInput: any = document.getElementById('custom-problem-file-select');
        const problemFile = problemFileInput.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const target: any = e.target;
                const fileText = target.result;
                const problem = JSON.parse(fileText);
                component.customProblemService.setCustomProblem(problem);
                component.router.navigate(['problem/custom']);
            } catch (err) {
                component.customProblemErrorText = err.message;
            }
        };
        reader.readAsText(problemFile);
    }
}
