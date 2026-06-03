import { describe, expect, it } from 'vitest';

import { getPublicApplicantSin, getPublicChildrenSins, getPublicPartnerSin } from '~/.server/routes/helpers/public-application-route-helpers';

describe('public-application-route-helpers', () => {
  describe('getPublicApplicantSin', () => {
    it('returns the applicant SIN when set', () => {
      const state = {
        applicantInformation: { socialInsuranceNumber: '123456782' },
      } as const;

      expect(getPublicApplicantSin(state)).toBe('123456782');
    });

    it('returns undefined when applicantInformation is absent', () => {
      const state = {
        applicantInformation: undefined,
      } as const;

      expect(getPublicApplicantSin(state)).toBeUndefined();
    });
  });

  describe('getPublicPartnerSin', () => {
    it('returns the partner SIN when set', () => {
      const state = {
        partnerInformation: { socialInsuranceNumber: '123456782' },
      } as const;

      expect(getPublicPartnerSin(state)).toBe('123456782');
    });

    it('returns undefined when partnerInformation is absent', () => {
      const state = {
        partnerInformation: undefined,
      } as const;

      expect(getPublicPartnerSin(state)).toBeUndefined();
    });
  });

  describe('getPublicChildrenSins', () => {
    it('returns all children SINs when no excludeChildId is given', () => {
      const state = {
        children: [
          { id: 'a', information: { socialInsuranceNumber: '123456782' } },
          { id: 'b', information: { socialInsuranceNumber: '520325317' } },
        ],
      } as const;

      expect(getPublicChildrenSins(state)).toEqual(['123456782', '520325317']);
    });

    it('excludes the child matching excludeChildId', () => {
      const state = {
        children: [
          { id: 'a', information: { socialInsuranceNumber: '123456782' } },
          { id: 'b', information: { socialInsuranceNumber: '520325317' } },
        ],
      } as const;

      expect(getPublicChildrenSins(state, 'a')).toEqual(['520325317']);
    });

    it('returns undefined entries for children with no information', () => {
      const state = {
        children: [
          { id: 'a', information: undefined },
          { id: 'b', information: { socialInsuranceNumber: '123456782' } },
        ],
      } as const;

      expect(getPublicChildrenSins(state)).toEqual([undefined, '123456782']);
    });

    it('returns an empty array when no children exist', () => {
      const state = { children: [] } as const;

      expect(getPublicChildrenSins(state)).toEqual([]);
    });
  });
});
