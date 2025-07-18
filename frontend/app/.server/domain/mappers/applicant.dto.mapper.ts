import { injectable } from 'inversify';
import { Option } from 'oxide.ts';

import type { ApplicantRequestEntity, ApplicantResponseEntity } from '~/.server/domain/entities';

export interface ApplicantDtoMapper {
  mapSinToApplicantRequestEntity(sin: string): ApplicantRequestEntity;
  mapApplicantResponseEntityToClientNumber(applicantResponseEntity: ApplicantResponseEntity): Option<string>;
}

@injectable()
export class DefaultApplicantDtoMapper implements ApplicantDtoMapper {
  mapSinToApplicantRequestEntity(sin: string): ApplicantRequestEntity {
    return {
      Applicant: {
        PersonSINIdentification: {
          IdentificationID: sin,
        },
      },
    };
  }

  mapApplicantResponseEntityToClientNumber(applicantResponseEntity: ApplicantResponseEntity): Option<string> {
    return Option.from(applicantResponseEntity.BenefitApplication?.Applicant?.ClientIdentification?.find(({ IdentificationCategoryText }) => IdentificationCategoryText === 'Client Number')?.IdentificationID);
  }
}
