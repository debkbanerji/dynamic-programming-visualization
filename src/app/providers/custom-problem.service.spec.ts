import { TestBed, inject } from '@angular/core/testing';

import { CustomProblemService } from './custom-problem.service';

describe('CustomProblemService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomProblemService]
    });
  });

  it('should be created', inject([CustomProblemService], (service: CustomProblemService) => {
    expect(service).toBeTruthy();
  }));
});
