import { TestBed } from '@angular/core/testing';

import { File } from './file';

describe('File', () => {
  let service: File;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(File);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
