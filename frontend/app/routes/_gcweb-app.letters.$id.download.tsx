import { type LoaderFunctionArgs } from '@remix-run/node';

// TODO Refactor the loader to fetch pdf using service
export async function loader({ params }: LoaderFunctionArgs) {
  // replace with actual file from api
  const filePath = '/test.pdf';

  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Response('File not found', { status: 404 });
  }

  const headers = new Headers();
  headers.append('Content-Type', 'application/pdf');
  headers.append('Content-Disposition', `inline; filename="test.pdf"`);

  return new Response(response.body, {
    headers: headers,
  });
}
