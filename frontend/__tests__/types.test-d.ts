import { type ExtractFuncParm, type ExtractLast, type RemoveLast, type ToFunc, type ToIntersection, type ToTuple, type ToTupleArray } from '~/types';

describe('ToFunc<T> utility type', () => {
  it('expect <(k: string) => void> for <string> type', () => {
    expectTypeOf({} as ToFunc<string>).toEqualTypeOf<(k: string) => void>();
  });

  it('expect <(k: string) => void> for <string | string> type', () => {
    expectTypeOf({} as ToFunc<string | string>).toEqualTypeOf<(k: string) => void>();
  });

  it('expect <((k: string) => void) | ((k: number) => void) | ((k: false) => void) | ((k: true) => void)> for <boolean | string | number> type', () => {
    expectTypeOf({} as ToFunc<boolean | string | number>).toEqualTypeOf<((k: string) => void) | ((k: number) => void) | ((k: false) => void) | ((k: true) => void)>();
  });
});

describe('ToIntersection<Union> utility type', () => {
  it('expect <string> for <string> type', () => {
    expectTypeOf({} as ToIntersection<string>).toEqualTypeOf<string>();
  });

  it('expect <string> for <string | string> type', () => {
    expectTypeOf({} as ToIntersection<string | string>).toEqualTypeOf<string>();
  });

  it('expect <never> for <string | number> type', () => {
    expectTypeOf({} as ToIntersection<string | number>).toEqualTypeOf<never>();
  });

  it('expect <((k: string) => void) & ((k: number) => void) & ((k: false) => void) & ((k: true) => void)> for <((k: string) => void) | ((k: number) => void) | ((k: false) => void) | ((k: true) => void)> type', () => {
    expectTypeOf({} as ToIntersection<((k: string) => void) | ((k: number) => void) | ((k: false) => void) | ((k: true) => void)>).toEqualTypeOf<((k: string) => void) & ((k: number) => void) & ((k: false) => void) & ((k: true) => void)>();
  });
});

describe('ExtractFuncParm<Func> utility type', () => {
  it('expect <string> for <(s: string, n: number) => void> type', () => {
    expectTypeOf({} as ExtractFuncParm<(s: string, n: number) => void>).toEqualTypeOf<string>();
  });

  it('expect <number> for <((s: string) => void) & ((s: number) => void)> type', () => {
    expectTypeOf({} as ExtractFuncParm<((s: string) => void) & ((s: number) => void)>).toEqualTypeOf<number>();
  });
});

describe('ExtractLast<Union> utility type', () => {
  it('expect <string> for <string> type', () => {
    expectTypeOf({} as ExtractLast<string>).toEqualTypeOf<string>();
  });

  it('expect <number> for <string | number> type', () => {
    expectTypeOf({} as ExtractLast<string | number>).toEqualTypeOf<number>();
  });
});

describe('RemoveLast<Union> utility type', () => {
  it('expect <never> for <string> type', () => {
    expectTypeOf({} as RemoveLast<string>).toEqualTypeOf<never>();
  });

  it('expect <string> for <string | number> type', () => {
    expectTypeOf({} as RemoveLast<string | number>).toEqualTypeOf<string>();
  });
});

describe('ToTupleArray<Union> utility type', () => {
  it('expect <[string]> for a <string, []> type', () => {
    expectTypeOf({} as ToTupleArray<string, []>).toEqualTypeOf<[string]>();
  });

  it('expect <[string, number]> for a <string | number, []> type', () => {
    expectTypeOf({} as ToTupleArray<string | number, []>).toEqualTypeOf<[string, number]>();
  });
});

describe('ToTuple<Union> utility type', () => {
  it('expect <[string]> for a <string> type', () => {
    expectTypeOf({} as ToTuple<string>).toEqualTypeOf<[string]>();
  });

  it('expect <[string, number]> for a <string | number> type', () => {
    expectTypeOf({} as ToTuple<string | number>).toEqualTypeOf<[string, number]>();
  });
});
