import { type LoaderFunctionArgs } from '@remix-run/node';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loader({ params }: LoaderFunctionArgs) {
  const filePath = path.join(__dirname, '..', 'public', 'test.pdf');

  try {
    const stats = await fs.promises.stat(filePath);
    const nodeStream = fs.createReadStream(filePath);
    const stream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        nodeStream.on('end', () => {
          controller.close();
        });
        nodeStream.on('error', (err) => {
          controller.error(err);
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': stats.size.toString(),
        'Content-Disposition': 'inline; filename="test.pdf"',
      },
    });
  } catch (error) {
    console.error('Failed to fetch PDF:', error);
    return new Response('Failed to fetch PDF', { status: 500 });
  }
}
