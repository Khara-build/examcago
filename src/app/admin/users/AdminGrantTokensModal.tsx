'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { grantUserTokensAction } from '@/app/actions/admin';
import { Coins, Plus, X } from 'lucide-react';

interface AdminGrantTokensModalProps {
  targetUserId: string;
  userEmail: string;
}

export function AdminGrantTokensModal({ targetUserId, userEmail }: AdminGrantTokensModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(5);
  const [description, setDescription] = useState('Admin promotional grant');
  const [loading, setLoading] = useState(false);

  async function handleGrant() {
    setLoading(true);
    await grantUserTokensAction(targetUserId, amount, description);
    setLoading(false);
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1 text-xs">
        <Coins className="h-3.5 w-3.5 text-brand-red" />
        Grant Tokens
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-bold text-gray-900">Grant Tokens to Student</h3>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Student: <strong className="text-gray-800">{userEmail}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Token Amount</label>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border rounded bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Reason / Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleGrant} isLoading={loading} className="bg-brand-red">
                Grant {amount} Tokens
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
