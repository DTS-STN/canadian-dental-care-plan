import React, { useEffect, useState } from 'react';

import { Link } from '@remix-run/react';

export interface Letter {
  id: string;
  subject: string;
  dateSent: string;
  referenceId: string;
}

export interface LetterListProps {
  letters: Letter[];
  i18n: { subject: string; dateSent: string; referenceId: string };
}

export const LetterList: React.FC<LetterListProps> = ({ letters, i18n }) => {
  const [isSortedLatest, setIsSortedLatest] = useState<boolean>(true);
  const [sorted, setSorted] = useState<Letter[]>(letters);

  useEffect(() => {
    setSorted(sortLetters(letters, isSortedLatest));
  }, [letters, isSortedLatest]);

  const sortLetters = (letters: Letter[], latest: boolean) => {
    return [...letters].sort((a, b) => {
      return latest ? new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime() : new Date(a.dateSent).getTime() - new Date(b.dateSent).getTime();
    });
  };

  const handleClick = () => {
    setIsSortedLatest(!isSortedLatest);
  };

  return (
    <div>
      <button onClick={handleClick}>Sort by date</button>
      <div className="border-l border-r border-t">
        <div className="grid grid-cols-3 divide-x divide-gray-300 bg-gray-100 md:grid-cols-[3fr_1fr_1fr]">
          <strong className="border-b border-gray-300 px-4">{i18n.subject}</strong>
          <strong className="border-b border-gray-300 px-4">{i18n.dateSent}</strong>
          <strong className="border-b border-gray-300 px-4">{i18n.referenceId}</strong>
        </div>
        <ul>
          {sorted.map((letter) => (
            <li key={letter.id} className="grid grid-cols-3 divide-x divide-gray-300 md:grid-cols-[3fr_1fr_1fr]">
              <span className="border-b border-gray-300 px-4">
                <Link to={`/letters/${letter.referenceId}`}>{letter.subject}</Link>
              </span>
              <span className="border-b border-gray-300 px-4">{new Date(letter.dateSent).toLocaleDateString()}</span>
              <span className="border-b border-gray-300 px-4">{letter.referenceId}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
