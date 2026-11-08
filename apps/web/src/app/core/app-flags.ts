import { environment } from '../../environments/environment';

export function isDesignSystemEnabled(): boolean {
  return environment.enableDesignSystem;
}

export function isGreenThemeEnabled(): boolean {
  return environment.enableGreenTheme;
}
