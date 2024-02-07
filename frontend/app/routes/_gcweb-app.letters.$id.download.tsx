import { type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useParams } from '@remix-run/react';

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

export default function ViewLetter() {
  const { id } = useParams();
  const { filePath } = useLoaderData<typeof loader>();

  return (
    <>
      <p>
        ID: {id}
        Path: {filePath}
      </p>
    </>
  );
}
