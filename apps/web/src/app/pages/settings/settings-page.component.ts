import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SupabaseAuthService } from '../../core/auth/supabase-auth.service';
import { UiCardComponent } from '../../ui/card/ui-card.component';
import { UiDataStripComponent } from '../../ui/data-strip/ui-data-strip.component';

@Component({
  selector: 'app-settings-page',
  imports: [UiCardComponent, UiDataStripComponent],
  template: `
    <section class="page settings-page">
      <header class="page-header">
        <h1>Settings</h1>
      </header>

      <ui-card title="Profile" subtitle="Your Meal Planner identity" appearance="shadow">
        <ui-data-strip label="Name" [value]="auth.userDisplayName() || 'Not set'"></ui-data-strip>
        <ui-data-strip label="Email" [value]="auth.userEmail() || 'Not available'"></ui-data-strip>
      </ui-card>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsPageComponent {
  protected readonly auth = inject(SupabaseAuthService);
}
