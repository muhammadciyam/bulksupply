"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Clock, CheckCircle2, AlertCircle } from "lucide-react";

type Slip = {
  fileName: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason: string | null;
} | null;

export function PaymentSlipUpload({ orderId, slip }: { orderId: string; slip: Slip }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file first");
      return;
    }
    setError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/orders/${orderId}/payment-slip`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed");
      return;
    }
    router.refresh();
  }

  if (slip?.status === "VERIFIED") {
    return (
      <div className="flex items-center gap-2 text-sm text-brand-green bg-emerald-50 rounded-md px-3 py-2">
        <CheckCircle2 size={16} /> Payment verified — {slip.fileName}
      </div>
    );
  }

  if (slip?.status === "PENDING") {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2">
        <Clock size={16} /> Awaiting verification — {slip.fileName}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {slip?.status === "REJECTED" && (
        <div className="flex items-start gap-2 text-sm text-brand-red bg-red-50 rounded-md px-3 py-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>
            Your previous slip was rejected{slip.rejectionReason ? `: ${slip.rejectionReason}` : "."} Please
            upload a new one.
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="text-xs"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-semibold px-3 py-1.5 rounded disabled:opacity-60"
        >
          <UploadCloud size={14} /> {uploading ? "Uploading..." : "Upload Slip"}
        </button>
      </div>
      <p className="text-[11px] text-gray-400">JPG, PNG, or PDF — up to 5MB.</p>
      {error && <p className="text-xs text-brand-red">{error}</p>}
    </div>
  );
}
