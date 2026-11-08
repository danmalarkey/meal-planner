import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-workspace-results-summary',
  standalone: true,
  template: `
    <span class="workspace-results-count">{{ label() }}</span>
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'workspace-results-summary' }
})
export class UiWorkspaceResultsSummaryComponent {
  readonly label = input.required<string>();
}
