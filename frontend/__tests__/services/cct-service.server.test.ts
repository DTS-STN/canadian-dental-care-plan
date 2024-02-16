import { http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, expectTypeOf, it, vi } from 'vitest';

import { getPdfEntity } from '~/mocks/cct-api.server';
import { getCCTService } from '~/services/cct-service.server';

vi.mock('~/utils/logging.server', () => ({
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
  }),
}));

vi.mock('~/utils/env.server.ts', () => ({
  getEnv: vi.fn().mockReturnValue({
    CCT_API_BASE_URI: 'https://api.example.com',
  }),
}));

const handlers = [
  http.get('https://api.example.com/cct/letters/:referenceId', async ({ params }) => {
    const pdfEntity = getPdfEntity(params.referenceId);
    const content = 'Hello, PDF!';
    const header = '%PDF-1.4\n';
    const body = `1 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`;
    const footer = '%%EOF';
    const pdfContent = `${header}${body}${footer}`;
    const pdfBuffer = Buffer.from(pdfContent, 'binary');
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${pdfEntity.id}.pdf"`,
      },
    });
  }),
];

const server = setupServer(...handlers);

const cctService = getCCTService();

describe('cct-service.server.ts', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterAll(() => {
    server.close();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('it should return a 200 response when given a valid referenceID', async () => {
    const response = await cctService.getPdf('liDTgtchkp');
    expect(response.status).toBe(200);
  });

  it('it should return "application/pdf" as a the response content-type when given a valid referenceId', async () => {
    const response = await cctService.getPdf('liDTgtchkp');
    expect(response.headers.get('content-type')).toBe('application/pdf');
  });

  it('it should return a ReadableStream when given a valid referenceId', async () => {
    const response = await cctService.getPdf('liDTgtchkp');
    expectTypeOf(response.body).toMatchTypeOf<ReadableStream<Uint8Array> | null>();
  });

  it('it should return a 404 when given an invalid referenceID', async () => {
    const response = await cctService.getPdf('invalidReferenceId');
    expect(response.status).toBe(404);
  });
});
