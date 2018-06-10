import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopulateGivenSolutionDialogComponent } from './populate-given-solution-dialog.component';

describe('PopulateGivenSolutionDialogComponent', () => {
  let component: PopulateGivenSolutionDialogComponent;
  let fixture: ComponentFixture<PopulateGivenSolutionDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopulateGivenSolutionDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopulateGivenSolutionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
