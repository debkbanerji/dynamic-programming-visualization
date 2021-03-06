import {Injectable} from '@angular/core';

const PROBLEM_PREFIX = '__PROBLEM_PROGRESS_DATA__';
const DARK_MODE_MARKER = '__DARK_MODE__';

@Injectable({
    providedIn: 'root'
})
export class ProgressService {

    private hasLocalStorage;

    constructor() {
        const component = this;
        component.hasLocalStorage = typeof (Storage) !== 'undefined';
    }

    getProblemProgressObjectSetIfNotExists(problemId: string, defaultValue) {
        const component = this;
        return component.getItemSetIfNotExists(PROBLEM_PREFIX + problemId, defaultValue);
    }

    getProblemProgressObjectNullIfNotExists(problemId: string) {
        const component = this;
        const key = PROBLEM_PREFIX + problemId;
        return component.hasItem(key) ? component.getItem(key) : null;
    }

    setProblemProgressObjectAsCompletedSetIfNotExists(problemId: string, solutionType: string, defaultValue) {
        const component = this;
        const key = PROBLEM_PREFIX + problemId;
        const currentProgress = component.getItemSetIfNotExists(key, defaultValue);
        currentProgress.hasSolvedSolutionTypes[solutionType] = true;
        component.setItem(key, currentProgress);
    }

    markProblemAsSolutionRevealedSetIfNotExists(problemId: string, defaultValue) {
        const component = this;
        const key = PROBLEM_PREFIX + problemId;
        const currentProgress = component.getItemSetIfNotExists(problemId, defaultValue);
        currentProgress.hasRevealedSolution = true;
        component.setItem(key, currentProgress);
    }

    getDarkModeStatus() {
        const component = this;
        return component.getItemSetIfNotExists(DARK_MODE_MARKER, false);
    }

    setDarkModeStatus(isDarkTheme: boolean) {
        const component = this;
        return component.setItem(DARK_MODE_MARKER, isDarkTheme);
    }

    public getHasLocalStorage(): boolean {
        return this.hasLocalStorage;
    }

    // Local storage wrapper functions
    private deleteItem(key: string): void {
        this.assertHasLocalStorage();
        localStorage.removeItem(key);
    }

    private setItem(key: string, value: any): void {
        this.assertHasLocalStorage();
        localStorage.setItem(key, JSON.stringify(value));
    }

    private hasItem(key: string): boolean {
        this.assertHasLocalStorage();
        return typeof localStorage[key] !== 'undefined';
    }

    private getItemSetIfNotExists(key: string, defaultValue: any): any {
        const component = this;
        component.assertHasLocalStorage();
        const exists = component.hasItem(key);
        if (exists) {
            return component.getItem(key);
        } else {
            component.setItem(key, defaultValue);
            return defaultValue;
        }
    }

    private getItem(key: string): any {
        this.assertHasLocalStorage();
        return JSON.parse(localStorage.getItem(key));
    }

    clearAll(): void {
        this.assertHasLocalStorage();
        localStorage.clear();
    }

    private assertHasLocalStorage(): void {
        if (!this.getHasLocalStorage()) {
            throw 'Local storage not available on browser';
        }
    }
}
