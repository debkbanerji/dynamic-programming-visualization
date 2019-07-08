import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ProgressService {

    private hasLocalStorage;

    constructor() {
        const component = this;
        component.hasLocalStorage = typeof (Storage) !== 'undefined';

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
        localStorage.setItem(key, value);
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
        return localStorage.getItem(key);
    }

    private clearAll(): void {
        this.assertHasLocalStorage();
        localStorage.clear();
    }

    private assertHasLocalStorage(): void {
        if (!this.getHasLocalStorage()) {
            throw 'Local storage not available on browser';
        }
    }
}
