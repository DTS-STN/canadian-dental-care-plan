import { Form, Link } from '@remix-run/react';

export default function ChangeAddress() {
  return (
    <>
      <h1 id="wb-cont" property="name">
        Change Address
      </h1>
      <Form method="post">
        <div className="form-group">
          <label htmlFor="homeAddress" className="required">
            Home address <strong className="text-danger">(required)</strong>
          </label>
          <input id="homeAddress" name="homeAddress" className="form-control" />
        </div>

        <div className="form-group">
          <label htmlFor="mailingAddress" className="required">
            Mailing address <strong className="text-danger">(required)</strong>
          </label>
          <input id="mailingAddress" name="mailingAddress" className="form-control" />
        </div>

        <div className="form-group">
          <ul className="list-inline lst-spcd">
            <li>
              <button id="changeButton" className="btn btn-primary btn-lg">Change</button>
            </li>
            <li>
              <Link id="cancelButton" to="/personal-information" className="btn btn-default btn-lg">Cancel</Link>
            </li>
          </ul>
        </div>
      </Form>
    </>
  );
}
