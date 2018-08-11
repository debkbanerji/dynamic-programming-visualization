import {Component, Inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {CustomProblemService} from "../providers/custom-problem.service";
import {DOCUMENT} from "@angular/common";
import {Title} from "@angular/platform-browser";

@Component({
    selector: 'app-select-problem',
    templateUrl: './select-problem.component.html',
    styleUrls: ['./select-problem.component.css']
})
export class SelectProblemComponent implements OnInit {

    isDarkTheme: boolean = false;

    customProblemFile: any;
    customProblemErrorText: string;

    // Register any new problems within the appropriate section
    sections = [
        {
            name: 'Subsequences',
            problems: [
                {
                    name: 'Longest Increasing Subsequence',
                    id: 'longest-increasing-subsequence'
                }
            ]
        },
        {
            name: 'Knapsack Variations',
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
        @Inject(DOCUMENT) document,
        private route: ActivatedRoute,
        private titleService: Title,
    ) {
    }

    ngOnInit() {
        const component = this;
        this.route.queryParams.subscribe(params => {
            component.isDarkTheme = (params['dark-mode'] == 'true');
        });
        component.titleService.setTitle('Dynamic Programming');
    }

    openProblem(id: string): void {
        this.router.navigate(['problem/' + id], {queryParams: {'dark-mode': this.isDarkTheme}});
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
                component.router.navigate(['problem/custom'], {queryParams: {'dark-mode': component.isDarkTheme}});
            } catch (err) {
                component.customProblemErrorText = err.message;
            }
        };
        reader.readAsText(problemFile);
    }

    onDarkModeChange() {
        this.router.navigate(['select-problem'], {queryParams: {'dark-mode': this.isDarkTheme}});
    }
}
