import { Link } from '@remix-run/react';

import { ButtonLink } from '~/components/buttons';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('gcweb'),
  documentTitleI18nKey: 'gcweb:header.application-title',
} as const satisfies RouteHandleData;

export default function RootIndex() {
  return (
    <main role="main" className="flex h-svh bg-splash-page bg-cover bg-center" property="mainContentOfPage">
      <div className="m-auto w-[300px] bg-white md:w-[400px] lg:w-[500px]">
        <div className="p-8">
          <h1 className="sr-only">Canadian Dental Care Plan | Régime canadien de soins dentaires</h1>
          <div className="w-11/12 lg:w-8/12">
            <Link to="https://www.canada.ca/en.html" property="url">
              <img className="h-8 w-auto" src="/assets/sig-blk-en.svg" alt="Government of Canada" property="logo" width="300" height="28" decoding="async" />
            </Link>
            <span className="sr-only">
              / <span lang="fr">Gouvernement du Canada</span>
            </span>
          </div>
          <div className="mb-2 mt-9 grid grid-cols-2 gap-8 md:mx-4 lg:mx-8">
            <section lang="en">
              <h2 className="sr-only">Government of Canada</h2>
              <ButtonLink variant="primary" to="/apply?lang=en" id="english-button" lang="en" size="lg" className="w-full">
                English
              </ButtonLink>
            </section>
            <section lang="fr">
              <h2 className="sr-only">Gouvernement du Canada</h2>
              <ButtonLink variant="primary" to="/apply?lang=fr" id="french-button" lang="fr" size="lg" className="w-full">
                Français
              </ButtonLink>
            </section>
          </div>
        </div>
        <div className="flex items-center justify-between gap-6 bg-gray-200 p-8">
          <div className="w-7/12 md:w-8/12">
            <Link className="text-slate-700 hover:underline" to="https://www.canada.ca/en/transparency/terms.html" lang="en">
              Terms & Conditions
            </Link>
            <span className="text-gray-400"> • </span>
            <Link className="text-slate-700 hover:underline" to="https://www.canada.ca/fr/transparence/avis.html" lang="fr">
              Avis
            </Link>
          </div>
          <div className="w-5/12 md:w-4/12">
            <img src="/assets/wmms-blk.svg" alt="Symbol of the Government of Canada" width={300} height={71} className="h-10 w-auto" />
            <span className="sr-only">
              / <span lang="fr">Symbole du gouvernement du Canada</span>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
