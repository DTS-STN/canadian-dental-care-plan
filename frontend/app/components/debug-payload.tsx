import { useEffect, useState } from 'react';

import { faCheck, faClipboard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from './buttons';

export type debugPayloadtProps = {
  data?: unknown;
  enableCopy?: boolean;
};
export function DebugPayload({ data, enableCopy }: debugPayloadtProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [hasCopied]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(json);
    setHasCopied(true);
  };

  return (
    <>
      <pre className="rounded-log block max-h-96 overflow-auto bg-gray-100 p-4 shadow-inner">{json}</pre>
      {enableCopy && (
        <Button onClick={copyToClipboard}>
          Copy
          <FontAwesomeIcon icon={hasCopied ? faCheck : faClipboard} className="ms-3 block size-4" />
        </Button>
      )}
    </>
  );
}
