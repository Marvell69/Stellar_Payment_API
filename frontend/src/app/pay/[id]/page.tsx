"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { isFreighterAvailable } from "@/lib/freighter";
import { usePayment } from "@/lib/usePayment";
import CopyButton from "@/components/CopyButton";
import toast from "react-hot-toast";

interface PaymentDetails {
  id: string;
  amount: number;
  asset: string;
  asset_issuer: string | null;
  recipient: string;
  description: string | null;
  status: string;
  tx_id: string | null;
  created_at: string;
}

function AssetIcon({ asset }: { asset: string }) {
  const normalizedAsset = asset.toUpperCase();

  if (normalizedAsset === "XLM" || normalizedAsset === "NATIVE") {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-white/15 via-mint/20 to-mint/40 text-mint shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M14.5 3.5 9 9l4.5.5L13 14l5.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 18c3.5-1 6-3.5 7-7" strokeLinecap="round" />
          <path d="M7.5 16.5 4.5 19.5" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  if (normalizedAsset === "USDC") {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#2775CA] text-[10px] font-bold tracking-[0.18em] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
      >
        USDC
      </span>
    );
  }

  return null;
}

export default function PaymentPage() {
  const params = useParams();
  const paymentId = params.id as string;

  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFreighterAvailableState, setIsFreighterAvailable] = useState(false);

  const { isProcessing, status: txStatus, error: paymentError, processPayment } = usePayment();

  // Fetch payment details
  useEffect(() => {
    const controller = new AbortController();

    const fetchPayment = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const response = await fetch(`${apiUrl}/api/payment-status/${paymentId}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Payment not found");
        }

        const data = await response.json();
        setPayment(data.payment); // Fixing data structure - backend returns { payment: data }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to fetch payment details");
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();

    return () => controller.abort();
  }, [paymentId]);

  // Poll payment status every 5 seconds until confirmed/completed
  useEffect(() => {
    if (loading) return;

    const isSettled = payment?.status === "confirmed" || payment?.status === "completed";
    if (!payment || isSettled) return;

    const intervalId = setInterval(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const response = await fetch(`${apiUrl}/api/payment-status/${paymentId}`);

        if (!response.ok) return;

        const data = await response.json();
        if (data.payment) {
          setPayment(data.payment);
        }
      } catch {
        // Silent failure — polling will retry on next interval
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [paymentId, payment, loading]);

  // Check if Freighter is available
  useEffect(() => {
    const checkFreighter = async () => {
      try {
        const available = await isFreighterAvailable();
        setIsFreighterAvailable(available);
      } catch {
        setIsFreighterAvailable(false);
      }
    };

    checkFreighter();
  }, []);

  const handlePayWithWallet = async () => {
    if (!payment || !isFreighterAvailableState) {
      setError("Freighter wallet not available");
      return;
    }

    try {
      const result = await processPayment({
        recipient: payment.recipient,
        amount: String(payment.amount),
        assetCode: payment.asset,
        assetIssuer: payment.asset_issuer,
      });

      setPayment({
        ...payment,
        status: "completed",
        tx_id: result.hash,
      });

      toast.success("Payment completed successfully!");

      // Verify the payment with the backend
      setTimeout(async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
          await fetch(`${apiUrl}/api/verify-payment/${paymentId}`, { method: "POST" });
        } catch {
          // Silent error - the payment is still valid on-chain
        }
      }, 2000);
    } catch {
      const message = paymentError || "Failed to process payment";
      setError(message);
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-white/10"></div>
          <div className="h-12 w-full rounded bg-white/10"></div>
          <div className="h-32 w-full rounded bg-white/10"></div>
        </div>
      </main>
    );
  }

  if (error && !payment) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
          <p className="text-red-400">Error: {error}</p>
        </div>
      </main>
    );
  }

  if (!payment) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
          <p className="text-red-400">Payment not found</p>
        </div>
      </main>
    );
  }

  const isCompleted = payment.status === "completed";

  return (
    <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
      {/* Global Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-mint"></div>
            <p className="text-lg font-semibold text-white">Processing Transaction...</p>
            <p className="text-sm text-slate-400">Please wait while we confirm your payment</p>
          </div>
        </div>
      )}

      <header className="flex flex-col gap-2">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-mint">Payment Details</p>
        <h1 className="text-3xl font-semibold text-white">Complete Payment</h1>
      </header>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <div className="space-y-6">
          {/* Amount */}
          <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
            <span className="text-slate-300">Amount</span>
            <span className="flex items-center gap-2 text-3xl font-semibold text-white">
              <AssetIcon asset={payment.asset} />
              <span>
                {payment.amount} {payment.asset}
              </span>
            </span>
          </div>

          {/* Recipient */}
          <div className="space-y-2">
            <p className="text-sm text-slate-400">Recipient Address</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm text-white break-all">{payment.recipient}</p>
              <CopyButton text={payment.recipient} />
            </div>
          </div>

          {/* Description */}
          {payment.description && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Description</p>
              <p className="text-white">{payment.description}</p>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-400">Status:</p>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${isCompleted
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
              }`}>
              {isCompleted ? "Completed" : "Pending"}
            </span>
          </div>

          {/* Transaction Hash */}
          {payment.tx_id && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Transaction Hash</p>
              <div className="flex items-center gap-2">
                <a
                  href={`${process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org"}/transactions/${payment.tx_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-blue-400 hover:text-blue-300 break-all"
                >
                  {payment.tx_id}
                </a>
                <CopyButton text={payment.tx_id} />
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Status message */}
          {txStatus && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-sm text-blue-400">{txStatus}</p>
            </div>
          )}

          {/* Pay with Wallet Button */}
          {!isCompleted && (
            <div className="space-y-4 pt-4">
              {isFreighterAvailableState ? (
                <button
                  onClick={handlePayWithWallet}
                  disabled={isProcessing}
                  className="w-full rounded-lg bg-gradient-to-r from-mint to-mint/80 px-6 py-3 font-semibold text-black transition-all hover:shadow-lg hover:shadow-mint/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Pay with Freighter Wallet"}
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400">Freighter wallet not detected</p>
                  <a
                    href="https://freighter.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-lg border border-mint px-6 py-3 font-semibold text-mint transition-all hover:bg-mint/10"
                  >
                    Install Freighter Extension
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isCompleted && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6 text-center">
          <p className="text-lg font-semibold text-green-400">Payment Completed!</p>
          <p className="mt-2 text-sm text-green-400/80">
            Thank you for your payment. Your transaction has been confirmed on the Stellar network.
          </p>
        </div>
      )}
    </main>
  );
}
