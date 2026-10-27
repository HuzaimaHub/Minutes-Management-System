import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Agendas } from './agendas';

describe('Agendas', () => {
  let component: Agendas;
  let fixture: ComponentFixture<Agendas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Agendas],
    }).compileComponents();

    fixture = TestBed.createComponent(Agendas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
