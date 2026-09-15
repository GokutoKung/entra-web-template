import { useState } from 'react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard API can be blocked (insecure origin / permissions); ignore.
    }
  }

  return (
    <button type="button" className="btn btn--ghost btn--sm" onClick={copy}>
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}
