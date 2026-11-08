import { Routes } from '@angular/router';
import { isDesignSystemEnabled } from './core/app-flags';
import { buildRoutes } from './app.route-definitions';

export const routes: Routes = buildRoutes(isDesignSystemEnabled());
