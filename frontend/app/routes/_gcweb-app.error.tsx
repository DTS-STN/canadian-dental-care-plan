export async function loader() {
  throw new Error('Keyboard not responding. Press any key to continue.');
}

/**
 * Error route used to test error handling.
 * TODO :: GjB :: eventually remove
 */
export default function Err() {
  return <></>;
}
