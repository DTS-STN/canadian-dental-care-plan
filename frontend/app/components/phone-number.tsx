export type PhoneNumberProps = {
    editMode?: boolean;
    fieldErrors?: string[];
    phoneNumber?: string;
    previousPhoneNumber?: string;
};

export function PhoneNumber({ editMode, fieldErrors, phoneNumber, previousPhoneNumber }: PhoneNumberProps) {
  return (
    <>
      {previousPhoneNumber !== undefined && <>
        <label htmlFor="previousPhoneNumber">
          <span className="field-name">Previous phone number</span>
        </label>
        <input id="previousPhoneNumber" name="previousPhoneNumber" className="form-control" maxLength={32} defaultValue={previousPhoneNumber} data-testid="previousPhoneNumber" disabled={true}/>
      </>}
      <label htmlFor="phoneNumber" className={editMode ? "required" : "none"}>
          <span className="field-name">{previousPhoneNumber !== undefined ? "New phone number" : "Phone number"}</span>
          {editMode && <strong className="required mrgn-lft-sm">(required)</strong>}
          {(editMode && fieldErrors) &&
              fieldErrors.map((error, idx) => (
                  <span key={idx} className="label label-danger wb-server-error">
                      <strong>
                          <span className="prefix">Error:</span>
                          <span className="mrgn-lft-sm">{error}</span>
                      </strong>
                  </span>
              ))}
      </label>
      <input id="phoneNumber" name="phoneNumber" className="form-control" maxLength={32} defaultValue={phoneNumber} data-testid="phoneNumber" disabled={!editMode}/>
    </>
  );
}