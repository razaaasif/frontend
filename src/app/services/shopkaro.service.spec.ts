import { TestBed } from '@angular/core/testing';

import { ShopkaroService } from './shopkaro.service';

describe('ShopkaroService', () => {
  let service: ShopkaroService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShopkaroService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
