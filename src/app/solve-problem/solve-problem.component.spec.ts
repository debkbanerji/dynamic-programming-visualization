import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SolveProblemComponent } from './solve-problem.component';

describe('SolveProblemComponent', () => {
  let component: SolveProblemComponent;
  let fixture: ComponentFixture<SolveProblemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SolveProblemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SolveProblemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
