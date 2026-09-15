import { useMemo } from 'react';
import CopyButton from './CopyButton';

export default function JsonBlock({ value }: { value: unknown }) {
  const text = useMemo(() => JSON.stringify(value, null, 2), [value]);
  return (
    <div className="json">
      <div className="json__bar">
        <CopyButton text={text} />
      </div>
      <pre className="json__body">{text}</pre>
    </div>
  );
}
