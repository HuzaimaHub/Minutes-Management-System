import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Minutes } from './minutes';

describe('Minutes', () => {
  let component: Minutes;
  let fixture: ComponentFixture<Minutes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Minutes],
    }).compileComponents();

    fixture = TestBed.createComponent(Minutes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
