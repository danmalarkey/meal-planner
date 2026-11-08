import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideSupabaseClient } from './core/supabase/supabase-client';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  const runtimeWindow = window as Window & {
    mealPlannerEnv?: { supabaseUrl?: string; supabaseAnonKey?: string };
  };
  const originalRuntimeConfig = runtimeWindow.mealPlannerEnv;

  beforeEach(async () => {
    runtimeWindow.mealPlannerEnv = { supabaseUrl: '', supabaseAnonKey: '' };
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideSupabaseClient()]
    }).compileComponents();
  });

  afterAll(() => {
    runtimeWindow.mealPlannerEnv = originalRuntimeConfig;
  });

  it('creates the application shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('ui-toast-host')).not.toBeNull();
  });
});
