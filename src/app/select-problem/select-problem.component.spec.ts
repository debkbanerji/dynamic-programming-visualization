import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectProblemComponent } from './select-problem.component';

describe('SelectProblemComponent', () => {
  let component: SelectProblemComponent;
  let fixture: ComponentFixture<SelectProblemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectProblemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectProblemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
