import {Component, Inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CustomProblemService} from '../providers/custom-problem.service';
import {DOCUMENT} from '@angular/common';
import {Title} from '@angular/platform-browser';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {ProgressService} from '../providers/progress.service';

@Component({
    selector: 'app-select-problem',
    templateUrl: './select-problem.component.html',
    styleUrls: ['./select-problem.component.css']
})
export class SelectProblemComponent implements OnInit {

    isDarkTheme = false;

    LOGO_URL = '/assets/images/Logo.png';

    customPanelOpenState = false;
    customProblemFile: any;
    customProblemErrorText: string;

    totalProblems: number;

    version = environment.VERSION;

    sections = [];
    problemFileVersion = null;

    progressData = {};

    constructor(
        private router: Router,
        private customProblemService: CustomProblemService,
        @Inject(DOCUMENT) document,
        private route: ActivatedRoute,
        private titleService: Title,
        private http: HttpClient,
        private progressService: ProgressService
    ) {
    }

    ngOnInit() {
        const component = this;
        this.route.queryParams.subscribe(params => {
            // noinspection TsLint
            component.isDarkTheme = (params['dark-mode'] == 'true');
        });
        component.titleService.setTitle('Dynamic Programming');
        component.http.get('../assets/problems/problem-directory.json').subscribe((data: any) => {
            component.sections = data.sections;
            component.problemFileVersion = data.version;
            component.totalProblems = 0;
            component.sections.forEach(function (section) {
                component.totalProblems += section.problems.length;
            });
            component.setUpProgressData();
        });
    }

    setUpProgressData(): void {
        const component = this;
        component.progressData = {};
        if (component.progressService.getHasLocalStorage()) {
            const objectDefaultProgressTypePromises = [];
            component.sections.forEach(function (section) {
                component.totalProblems += section.problems.length;
                section.problems.forEach(function (problem) {
                    objectDefaultProgressTypePromises.push(new Promise((resolve, reject) => {
                        component.http.get('../assets/problems/' + problem['id'] + '.dp.json').subscribe(data => {
                            // resolve(data);
                            const solutionTypes = ['bottomUp']; // Bottom up solution should always exist
                            if (data['provided-solution'].returnValueTopDownCode) {
                                solutionTypes.push('topDown');
                            }
                            if (data['output'].solution) {
                                solutionTypes.push('detailedBottomUp');
                                if (data['provided-solution'].returnValueTopDownCode) {
                                    solutionTypes.push('detailedTopDown');
                                }
                            }
                            resolve({
                                id: problem.id,
                                solutionTypes
                            });
                        }, err => {
                            reject(err);
                        });
                    }));
                });
            });

            Promise.all(objectDefaultProgressTypePromises).then(problems => {
                problems.forEach((problem => {
                        const progressData = component.progressService.getProblemProgressObjectNullIfNotExists(problem['id']);
                        if (progressData) {
                            const progressMap = progressData.hasSolvedSolutionTypes;
                            const progressArray = [];
                            let basicSolved = progressMap['bottomUp'] || progressMap['topDown'];
                            if (progressMap.hasOwnProperty('detailedBottomUp') || progressMap.hasOwnProperty('detailedTopDown')) {
                                const detailedSolved = progressMap['detailedBottomUp'] || progressMap['detailedTopDown'] && !progressData.hasRevealedSolution;
                                const detailedProgressObject = {
                                    'type': detailedSolved ? 'Full Solution Found' : 'Full Solution Not Yet Found',
                                    'completed': detailedSolved
                                };
                                basicSolved = basicSolved || detailedSolved;
                                progressArray.push(detailedProgressObject);
                            }
                            basicSolved = basicSolved && !progressData.hasRevealedSolution;
                            const basicProgressObject = {
                                'type': basicSolved ? 'Solution Found' : 'Solution Not Yet Found',
                                'completed': basicSolved && !progressData.hasRevealedSolution
                            };
                            progressArray.unshift(basicProgressObject);
                            component.progressData[problem['id']] =
                                {
                                    hasRevealedSolution: progressData.hasRevealedSolution,
                                    progressArray
                                };
                        }
                    })
                );
            });
        }
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
