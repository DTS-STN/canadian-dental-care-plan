import { type Namespace } from 'i18next';

export interface RouteHandle extends Record<string, unknown> {
  i18nNamespaces?: Namespace;
}
