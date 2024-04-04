import { readFileSync } from 'node:fs';

/**
 * @typedef {import('@remix-run/dev').AppConfig} AppConfig
 * @typedef {(DefineRouteFunction) => void} DefineRoutesFunction
 * @typedef {import('@remix-run/dev/dist/config/routes').DefineRouteFunction} DefineRouteFunction
 * @typedef {import('@remix-run/dev/dist/config/routes').DefineRouteOptions} DefineRouteOptions
 * @typedef {() => void} DefineRouteChildren
 * @typedef {'en' | 'fr'} Language
 * @typedef {{
 *   children?: JsonRoute;
 *   file: string;
 *   id: string;
 *   index?: boolean;
 *   paths?: {
 *     en: string;
 *     fr: string
 *   };
 * }} JsonRoute
 */

/**
 * @param {DefineRoutesFunction} defineRoutesFn
 * @param {Array<JsonRoute>} jsonRoutes
 */
function jsonRoutes(defineRoutesFn, jsonRoutes) {
  return defineRoutesFn((routeFn) => {
    jsonRoutes.forEach((jsonRoute) => {
      defineRoute('en', routeFn, jsonRoute);
      defineRoute('fr', routeFn, jsonRoute);
    });
  });
}

/**
 * @param {Language} language
 * @param {DefineRouteFunction} routeFn
 * @param {JsonRoute} jsonRoute
 */
function defineRoute(language, routeFn, jsonRoute) {
  const file = jsonRoute.file;
  const path = language === 'en' ? jsonRoute.paths?.en : jsonRoute.paths?.fr;

  /** @type {DefineRouteChildren} */
  const defineRouteChildren = jsonRoute.children ? () => jsonRoute.children.forEach((child) => defineRoute(language, routeFn, child)) : () => {};

  /** @type {DefineRouteOptions} */
  const options = { ...jsonRoute, id: `${jsonRoute.id}-${language}` };

  routeFn(path, file, options, defineRouteChildren);
}

/**
 * @type {AppConfig}
 */
export default {
  cacheDirectory: './node_modules/.cache/remix',
  ignoredRouteFiles: ['**/*'], // we will manually configure routes (see below)
  routes: (defineRoutes) => jsonRoutes(defineRoutes, JSON.parse(readFileSync('./app/routes.json', 'utf8'))),
  serverDependenciesToBundle: ['react-idle-timer'],
};
