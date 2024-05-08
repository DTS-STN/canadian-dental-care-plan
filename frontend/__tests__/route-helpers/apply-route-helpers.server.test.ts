import { describe, expect, it } from 'vitest';

import { getAgeCategoryFromAge } from '~/route-helpers/apply-route-helpers.server';

describe('getAgeCategoryFromAge', () => {
  it.each([65, 100, 150])('getAgeCategoryFromAge(%s) should return "seniors" for age greater than or equal to 65', (age) => {
    const result = getAgeCategoryFromAge(age);
    expect(result).toEqual('seniors');
  });

  it.each([18, 25, 64, 64.9])('getAgeCategoryFromAge(%s) should return "adults" for age greater than or equal to 18 and less than 65', (age) => {
    const result = getAgeCategoryFromAge(age);
    expect(result).toEqual('adults');
  });

  it.each([16, 17, 17.9])('getAgeCategoryFromAge(%s) should return "youth" for age greater than or equal to 16 and less than 18', (age) => {
    const result = getAgeCategoryFromAge(age);
    expect(result).toEqual('youth');
  });

  it.each([0.1, 1, 15, 15.9])('getAgeCategoryFromAge(%s) should return "children" for age greater than 0 and less than 16', (age) => {
    const result = getAgeCategoryFromAge(age);
    expect(result).toEqual('children');
  });

  it.each([-1, 0])('getAgeCategoryFromAge(%s) should throw an error for age less than or equal to 0', (age) => {
    expect(() => {
      getAgeCategoryFromAge(age);
    }).toThrowError(`Invalid age [${age}]`);
  });
});
