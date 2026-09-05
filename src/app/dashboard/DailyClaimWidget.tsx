'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { claimDailyTokenAction } from '@/app/actions/tokens';
import { Sparkles, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

interface DailyClaimWidgetProps {
  tokenBalance: number;
  alreadyClaimedToday: boolean;
  todayBD: string;
}

export function DailyClaimWidget({
  tokenBalance,
  alreadyClaimedToday: initialClaimed,
  todayBD,
}: DailyClaimWidgetProps) {
  const [claimed, setClaimed] = useState(initialClaimed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleClaim() {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const res = await claimDailyTokenAction();

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setClaimed(true);
      setSuccessMsg('Successfully claimed 1 Free Token! Token added to your balance.');
      setLoading(false);
    }
  }

  return (
    <div className="pt-3 border-t border-gray-100 space-y-2">
      <div className="flex items-center justify-between text-[11px] text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>BD Date: {todayBD}</span>
        </span>
        <span>1 Claim / Day</span>
      </div>

      {error && (
        <div className="p-2 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-2 rounded bg-green-50 border border-green-200 text-xs text-green-700 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {claimed ? (
        <div className="p-2.5 rounded-md bg-gray-100 border border-gray-200 text-center text-xs font-semibold text-gray-600 flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>Daily Token Claimed Today</span>
        </div>
      ) : (
        <Button
          variant="primary"
          size="sm"
          className="w-full justify-center gap-2 shadow-sm"
          onClick={handleClaim}
          isLoading={loading}
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          Claim Free Daily Token
        </Button>
      )}
    </div>
  );
}
