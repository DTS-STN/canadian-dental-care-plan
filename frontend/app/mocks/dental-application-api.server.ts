import { HttpResponse, http } from 'msw';
// import { setTimeout } from 'timers/promises'; // uncomment to simulate the length of the full API call
import { z } from 'zod';

import { getLogger } from '~/utils/logging.server';

const log = getLogger('dental-application-api.server');

/**
 * Server-side MSW mocks for the Dental Application API
 */
export function getDentalApplicationApiMockHandlers() {
  log.info('Initializing Dental Application mock handlers');

  return [
    http.post('https://api.example.com/SubmitDentalApplication', async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);

      const dentalApplicationSchema = z.object({
        esdc_captcha: z
          .object({
            sitekey: z.string(),
            response: z.string(),
          })
          .optional(),
        esdc_applicationinfo: z.object({
          Application: z.object({
            'esdc_ApplicationYearid@odata.bind': z.string().optional(),
            esdc_recordsource: z.string().optional(),
          }),
          Applicant: z.object({
            Record: z.object({
              esdc_socialinsurancenumber: z.string(),
              esdc_firstname: z.string(),
              esdc_lastname: z.string(),
              esdc_maritalstatus: z.number(),
              esdc_dateofbirth: z.string().datetime(),

              esdc_preferredmethodofcommunication: z.number(),
              esdc_preferredlanguage: z.number(),

              emailaddress: z.string().optional(),
              esdc_phonenumber: z.string().optional(),
              esdc_phonenumber2: z.string().optional(),

              esdc_homeaddressapartmentunitnumber: z.string().optional(),
              esdc_homeaddressstreet: z.string(),
              esdc_homeaddresscity: z.string(),
              'esdc_HomeAddressProvinceTerritoryStateid@odata.bind': z.string().optional(),
              'esdc_HomeAddressCountryid@odata.bind': z.string(),
              esdc_homeaddresspostalzipcode: z.string().optional(),

              esdc_mailingaddresssameashomeaddress: z.number(),

              esdc_mailingaddressapartmentunitnumber: z.string().optional(),
              esdc_mailingaddressstreet: z.string(),
              esdc_mailingaddresscity: z.string(),
              'esdc_MailingAddressProvinceTerritoryStateid@odata.bind': z.string().optional(),
              'esdc_MailingAddressCountryid@odata.bind': z.string(),
              esdc_mailingaddresspostalzipcode: z.string().optional(),

              esdc_hasdentalinsurancecoverageemployerprivate: z.number(),
              esdc_hasdentalinsurancecoverageprovincialfederal: z.number(),
            }),
            esdc_governmentinsuranceplans: z
              .array(
                z.object({
                  id: z.string(),
                }),
              )
              .optional(),
          }),
          Spouse: z
            .object({
              Record: z.object({
                esdc_socialinsurancenumber: z.string(),
                esdc_firstname: z.string(),
                esdc_lastname: z.string(),
                esdc_dateofbirth: z.string(),
              }),
            })
            .optional(),
          Dependants: z
            .array(
              z.object({
                Record: z.object({
                  esdc_socialinsurancenumber: z.string(),
                  esdc_firstname: z.string(),
                  esdc_lastname: z.string(),
                  esdc_dateofbirth: z.string(),
                }),
              }),
            )
            .optional(),
          Demographics: z
            .object({
              esdc_wherewereyouborn: z.number().optional(),
              esdc_areyoufirstnations: z.number().optional(),
              esdc_ethnicity: z.number().optional(),
              esdc_ethnicityother: z.string().optional(),
              esdc_identifiesaspersonwithdisability: z.number().optional(),
              esdc_gender: z.number().optional(),
              esdc_sexatbirth: z.number().optional(),
              esdc_mouthpainoccurancepast12months: z.number().optional(),
              esdc_lasttimevisiteddentist: z.number().optional(),
              esdc_avoidedvisitingdentistlast12months: z.number().optional(),
            })
            .optional(),
        }),
      });

      // await setTimeout(5000); // uncomment to simulate the potential (5s) length of the full API call

      const dentalApplicationRequest = dentalApplicationSchema.safeParse(await request.json());
      if (!dentalApplicationRequest.success) {
        return new HttpResponse(null, { status: 400 });
      }

      return HttpResponse.json({
        esdc_processed: true,
        esdc_confirmationnumber: '123-123-123',
        esdc_errors: [],
        esdc_createdrecords: [],
        esdc_updatedrecords: [],
      });
    }),
  ];
}
