import { Link } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

export function PageFooter() {
  const { t } = useTranslation(['gcweb']);
  return (
    <footer id="wb-info" className="bg-stone-50 print:hidden">
      <div className="bg-gray-700 text-white">
        <section className="container py-6">
          <h2 className="mb-4">My Service Canada Account</h2>
          <div className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <Link className="hover:underline" to="https://example.com/contact-us">
              Contact Us
            </Link>
            <Link className="hover:underline" to="https://example.com/link-1">
              [Link1]
            </Link>
            <Link className="hover:underline" to="https://example.com/link-2">
              [Link2]
            </Link>
          </div>
        </section>
      </div>
      <div className="container py-7">
        <h2 className="sr-only">{t('gcweb:footer.about-site')}</h2>
        <div className="flex items-center justify-between gap-4">
          <nav aria-labelledby="gc-corporate">
            <h3 id="gc-corporate" className="sr-only">
              {t('gcweb:footer.gc-corporate')}
            </h3>
            <div className="flex flex-col items-start gap-2 text-sm leading-6 sm:flex-row sm:items-center sm:gap-4">
              <Link className="text-slate-700 hover:underline" to={t('gcweb:footer.terms-conditions.href')}>
                {t('gcweb:footer.terms-conditions.text')}
              </Link>
              <div className="hidden size-0 rounded-full border-[3px] border-slate-700 sm:block"></div>
              <Link className="text-slate-700 hover:underline" to={t('gcweb:footer.privacy.href')}>
                {t('gcweb:footer.privacy.text')}
              </Link>
            </div>
          </nav>
          <div>
            <img src="/assets/wmms-blk.svg" alt={t('gcweb:footer.gc-symbol')} width={300} height={71} className="h-10 w-auto" />
          </div>
        </div>
      </div>
    </footer>
  );
}
