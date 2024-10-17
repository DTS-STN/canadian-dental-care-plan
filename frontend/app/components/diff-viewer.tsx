import type { ReactNode } from 'react';
import { Fragment, useEffect, useState } from 'react';

import { diffChars } from 'diff';

interface DiffViewerProps {
  ignoreCase?: boolean;
  oldStr: string;
  newStr: string;
}

export function DiffViewer({ ignoreCase = true, oldStr, newStr }: DiffViewerProps) {
  const [formattedDiff, setFormattedDiff] = useState<ReactNode[]>([]);

  useEffect(() => {
    const diffResult = diffChars(oldStr, newStr, { ignoreCase });
    const formattedDiff = diffResult.map((diff, index) => {
      // Use diff.value as key only when added or removed, otherwise use index to avoid duplicate keys
      const key = diff.added || diff.removed ? diff.value : `${diff.value}-${index}`;
      if (diff.added) {
        return (
          <ins key={key} className="bg-green-100">
            {diff.value}
          </ins>
        );
      }

      if (diff.removed) {
        return (
          <del key={key} className="bg-red-100">
            {diff.value}
          </del>
        );
      }

      return <Fragment key={key}>{diff.value}</Fragment>;
    });
    setFormattedDiff(formattedDiff);
  }, [oldStr, newStr, ignoreCase]);

  return <div className="diff-viewer-content">{formattedDiff}</div>;
}
