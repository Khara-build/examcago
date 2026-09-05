'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Copy, Check } from 'lucide-react';

interface ReferralCopyButtonProps {
  textToCopy: string;
  label: string;
}

export function ReferralCopyButton({ textToCopy, label }: ReferralCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 shrink-0"
      onClick={handleCopy}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{copied ? 'Copied!' : label}</span>
    </Button>
  );
}
