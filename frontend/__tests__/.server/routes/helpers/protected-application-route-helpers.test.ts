import { describe, expect, it } from 'vitest';

import { getProtectedApplicantSin, getProtectedChildrenSins, getProtectedPartnerSin, shouldSkipMaritalStatus } from '~/.server/routes/helpers/protected-application-route-helpers';

describe('protected-application-route-helpers', () => {
  describe('shouldSkipMaritalStatus', () => {
    it('returns false when client application is undefined', () => {
      const state = {
        context: 'renewal',
        clientApplication: undefined,
      } as const;

      expect(shouldSkipMaritalStatus(state)).toBe(false);
    });

    it('returns false when input model is full', () => {
      const state = {
        context: 'renewal',
        clientApplication: {
          inputModel: 'full',
        },
      } as const;

      expect(shouldSkipMaritalStatus(state)).toBe(false);
    });

    it('returns true when input model is simplified', () => {
      const state = {
        context: 'renewal',
        clientApplication: {
          inputModel: 'simplified',
        },
      } as const;

      expect(shouldSkipMaritalStatus(state)).toBe(true);
    });
  });

  describe('getProtectedApplicantSin', () => {
    it('returns the intake SIN when context is intake', () => {
      const state = {
        context: 'intake',
        applicantInformation: { socialInsuranceNumber: '123456782' },
        clientApplication: { applicantInformation: { socialInsuranceNumber: '520325317' } },
      } as const;

      expect(getProtectedApplicantSin(state)).toBe('123456782');
    });

    it('returns the renewal SIN when context is renewal', () => {
      const state = {
        context: 'renewal',
        applicantInformation: { socialInsuranceNumber: '123456782' },
        clientApplication: { applicantInformation: { socialInsuranceNumber: '520325317' } },
      } as const;

      expect(getProtectedApplicantSin(state)).toBe('520325317');
    });

    it('returns undefined when applicantInformation is absent in intake context', () => {
      const state = {
        context: 'intake',
        applicantInformation: undefined,
        clientApplication: undefined,
      } as const;

      expect(getProtectedApplicantSin(state)).toBeUndefined();
    });

    it('returns undefined when clientApplication is absent in renewal context', () => {
      const state = {
        context: 'renewal',
        applicantInformation: undefined,
        clientApplication: undefined,
      } as const;

      expect(getProtectedApplicantSin(state)).toBeUndefined();
    });
  });

  describe('getProtectedPartnerSin', () => {
    it('returns the partner SIN when set', () => {
      const state = {
        partnerInformation: { socialInsuranceNumber: '123456782' },
      } as const;

      expect(getProtectedPartnerSin(state)).toBe('123456782');
    });

    it('returns undefined when partnerInformation is absent', () => {
      const state = {
        partnerInformation: undefined,
      } as const;

      expect(getProtectedPartnerSin(state)).toBeUndefined();
    });
  });

  describe('getProtectedChildrenSins', () => {
    it('returns all children SINs when no excludeChildId is given', () => {
      const state = {
        children: [
          { id: 'a', information: { socialInsuranceNumber: '123456782' } },
          { id: 'b', information: { socialInsuranceNumber: '520325317' } },
        ],
      } as const;

      expect(getProtectedChildrenSins(state)).toEqual(['123456782', '520325317']);
    });

    it('excludes the child matching excludeChildId', () => {
      const state = {
        children: [
          { id: 'a', information: { socialInsuranceNumber: '123456782' } },
          { id: 'b', information: { socialInsuranceNumber: '520325317' } },
        ],
      } as const;

      expect(getProtectedChildrenSins(state, 'a')).toEqual(['520325317']);
    });

    it('returns undefined entries for children with no information', () => {
      const state = {
        children: [
          { id: 'a', information: undefined },
          { id: 'b', information: { socialInsuranceNumber: '123456782' } },
        ],
      } as const;

      expect(getProtectedChildrenSins(state)).toEqual([undefined, '123456782']);
    });

    it('returns an empty array when no children exist', () => {
      const state = { children: [] } as const;

      expect(getProtectedChildrenSins(state)).toEqual([]);
    });
  });
});
