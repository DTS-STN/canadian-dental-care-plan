import { Form, Link } from '@remix-run/react';

export default function ChangeAddress() {
  return (
    <>
      <h1 id="wb-cont" property="name">
        Change Address
      </h1>
      <Form method="post">
        <fieldset>
          <legend>Home address:</legend>
          <div>
            <label htmlFor="homeAddress" className="required">
              Address
            </label>
            <input id="homeAddress" name="homeAddress" className="form-control" size={75} />

            <label htmlFor="homeCity" className="required">
              City
            </label>
            <input id="homeCity" name="homeCity" className="form-control" size={35}/> 

            <label htmlFor="homePostalCode" className="required">
              Postal code
            </label>
            <input id="homePostalCode" name="homePostalCode" className="form-control"  size={7}/>

            <label htmlFor="homeProvince" className="required">
              Province
            </label>
            <input id="homeProvince" name="homeProvince" className="form-control" size={25}/>                                
          </div>
        </fieldset>

        <fieldset>
        <legend>Mailing address:</legend>
        <div className="form-group">
          <label htmlFor="mailingAddress" className="required">
            Address
          </label>
          <input id="mailingAddress" name="mailingAddress" className="form-control" size={100}/>

          <label htmlFor="mailingCity" className="required">
            City
          </label>
          <input id="mailingCity" name="mailingCity" className="form-control"/>

          <label htmlFor="mailingPostalCode" className="required">
            Postal code
          </label>
          <input id="mailingPostalCode" name="mailingPostalCode" className="form-control" size={7}/>

          <label htmlFor="mailingProvince" className="required">
            Province
          </label>
          <input id="mailingProvince" name="mailingProvince" className="form-control"/>                                
        </div>
        </fieldset>

        <div className="form-group">
          <button className="btn btn-primary btn-lg">Change</button>
        </div>
      </Form>
      <ul>
        <li></li>
      </ul>
      <Link to="/personal-information">Personal information</Link>
    </>
  );
}
