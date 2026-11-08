import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiAvatarComponent } from '../../ui/avatar/ui-avatar.component';
import { UiIconComponent } from '../../ui/icon/ui-icon.component';
import { UiPopoverComponent } from '../../ui/popover/ui-popover.component';

@Component({
  selector: 'app-account-menu',
  imports: [RouterLink, UiAvatarComponent, UiIconComponent, UiPopoverComponent],
  template: `
    <ui-popover
      class="account-menu"
      [triggerLabel]="'Open account menu for ' + userName()"
      panelLabel="Account menu"
      panelClass="account-menu-panel"
      autoClose="all"
    >
      <span popover-trigger class="account-menu-trigger">
        <ui-avatar [initials]="userInitials()" size="sm"></ui-avatar>
      </span>

      <div popover-panel class="ui-popover-menu">
        <div class="account-menu-identity">
          <span class="account-menu-name">{{ userName() }}</span>
          @if (userMeta()) {
            <span class="account-menu-meta">{{ userMeta() }}</span>
          }
        </div>
        <a class="ui-popover-action" routerLink="/settings" role="menuitem">
          <ui-icon name="settings" size="sm"></ui-icon>
          <span>Settings</span>
        </a>
        <button
          type="button"
          class="ui-popover-action ui-popover-action--danger"
          role="menuitem"
          (click)="signOutRequested.emit()"
        >
          <ui-icon name="sign-out" size="sm"></ui-icon>
          <span>Sign out</span>
        </button>
      </div>
    </ui-popover>
  `,
  styleUrl: './account-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountMenuComponent {
  readonly userName = input.required<string>();
  readonly userInitials = input.required<string>();
  readonly userMeta = input<string | null>(null);
  readonly signOutRequested = output<void>();
}
