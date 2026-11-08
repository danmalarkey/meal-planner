import { ChangeDetectionStrategy, Component, computed, DOCUMENT, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupabaseAuthService } from './core/auth/supabase-auth.service';
import { isGreenThemeEnabled } from './core/app-flags';
import { UiBrandComponent } from './ui/brand/ui-brand.component';
import { UiToastHostComponent } from './ui/toast/ui-toast-host.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UiBrandComponent, UiToastHostComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly document = inject(DOCUMENT);
  protected readonly auth = inject(SupabaseAuthService);
  protected readonly showAuthLoading = computed(() => this.auth.enabled() && !this.auth.ready());

  constructor() {
    this.document.documentElement.classList.toggle('ui-theme-green', isGreenThemeEnabled());
  }
}
