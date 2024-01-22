import { useTranslation } from 'react-i18next';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('update-phone-number', 'gcweb');

export type PhoneNumberProps = {
  editMode?: boolean;
  fieldErrors?: string[];
  phoneNumber?: string;
  previousPhoneNumber?: string;
};

export function PhoneNumber({ editMode, fieldErrors, phoneNumber, previousPhoneNumber }: PhoneNumberProps) {
  const { t } = useTranslation(i18nNamespaces)
  return (
    <>
      {previousPhoneNumber !== undefined && (
        <>
          <label htmlFor="previousPhoneNumber">
            <span className="field-name">{t('update-phone-number:component.previous')}</span>
          </label>
          <input id="previousPhoneNumber" name="previousPhoneNumber" className="form-control mrgn-bttm-sm" maxLength={32} defaultValue={previousPhoneNumber} data-testid="previousPhoneNumber" disabled={true} />
        </>
      )}
      <label htmlFor="phoneNumber" className={editMode ? 'required' : 'none'}>
        <span className="field-name">{previousPhoneNumber !== undefined ? `${t('update-phone-number:component.previous')}` : `${t('update-phone-number:component.phone')}`}</span>
        {editMode && <strong className="required mrgn-lft-sm">({t('gcweb:input-label.required')})</strong>}
        {editMode &&
          fieldErrors &&
          fieldErrors.map((error, idx) => (
            <span key={idx} className="label label-danger wb-server-error">
              <strong>
                <span className="prefix">{t('gcweb:input-label.error')}</span>
                <span className="mrgn-lft-sm">{error}</span>
              </strong>
            </span>
          ))}
      </label>
      <input id="phoneNumber" name="phoneNumber" className="form-control" maxLength={32} defaultValue={phoneNumber} data-testid="phoneNumber" disabled={!editMode} />
    </>
  );
}
