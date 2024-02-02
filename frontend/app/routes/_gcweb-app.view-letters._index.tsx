// import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { useTranslation } from 'react-i18next';

import { LetterList } from '~/components/letter-list';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('view-letters');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'view-letters:index.breadcrumbs.home', to: '/' }, { labelI18nKey: 'view-letters:index.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0002',
  pageTitleI18nKey: 'view-letters:index.page-title',
} as const satisfies RouteHandleData;

// Use the loader function to retrieve data from mock service

// export async function loader({ request }: LoaderFunctionArgs) {
//   const userId = await userService.getUserId();

//   if (!userId) {
//     throw new Response(null, { status: 404 });
//   }

//   const letters = await letterService.getLettersForUser(userId);
//   return json({ letters });
// }

export default function PersonalInformationIndex() {
  const { t } = useTranslation(i18nNamespaces);

  // dummy data for testing, should use retrieved data from mock when it's ready
  const letters = [
    { id: '112029', subject: 'Letter subject text 1', dateSent: '2022-07-20', referenceId: '898815' },
    { id: '014095', subject: 'Letter subject text 2', dateSent: '2023-04-22', referenceId: '443526' },
    { id: '428715', subject: 'Letter subject text 3', dateSent: '2022-08-21', referenceId: '803445' },
    { id: '780806', subject: 'Letter subject text 4', dateSent: '2022-02-14', referenceId: '445545' },
    { id: '762502', subject: 'Letter subject text 5', dateSent: '2023-05-14', referenceId: '746995' },
    { id: '295592', subject: 'Letter subject text 6', dateSent: '2022-05-04', referenceId: '766722' },
    { id: '284742', subject: 'Letter subject text 7', dateSent: '2022-06-23', referenceId: '978920' },
    { id: '157691', subject: 'Letter subject text 8', dateSent: '2022-04-15', referenceId: '547667' },
    { id: '816041', subject: 'Letter subject text 9', dateSent: '2023-07-07', referenceId: '726700' },
    { id: '538967', subject: 'Letter subject text 10', dateSent: '2023-03-11', referenceId: '624957' },
  ];
  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('view-letters:index.page-title')}
      </h1>
      <div>
        <LetterList letters={letters} i18n={{ subject: t('view-letters:index.subject'), dateSent: t('view-letters:index.date-sent'), referenceId: t('view-letters:index.reference-id') }} />
      </div>
    </>
  );
}
