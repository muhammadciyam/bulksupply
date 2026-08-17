"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { FileChooserInput } from "@/components/FileChooserInput";

type Slip = {
  fileName: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason: string | null;
} | null;

export function PaymentSlipUpload({ orderId, slip }: { orderId: string; slip: Slip }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [prevSlipProp, setPrevSlipProp] = useState(slip);
  const [localSlip, setLocalSlip] = useState(slip);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Stay in sync once the server (re)confirms the slip, e.g. after
  // router.refresh() below, or a staff verification/rejection elsewhere.
  if (slip !== prevSlipProp) {
    setPrevSlipProp(slip);
    setLocalSlip(slip);
  }

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file first");
      return;
    }
    setError("");
    const prevSlip = localSlip;
    // Optimistic: show it as "awaiting verification" immediately, revert to
    // the upload form (with an error) if the upload actually fails.
    setLocalSlip({ fileName: file.name, status: "PENDING", rejectionReason: null });
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
      setLocalSlip(prevSlip);
      setError(data.error ?? "Upload failed");
      return;
    }
    router.refresh();
  }

  if (localSlip?.status === "VERIFIED") {
    return (
      <div className="flex items-center gap-2 text-sm text-brand-green bg-blue-50 rounded-md px-3 py-2">
        <CheckCircle2 size={16} /> Payment verified — {localSlip.fileName}
      </div>
    );
  }

  if (localSlip?.status === "PENDING") {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2">
        <Clock size={16} /> Awaiting verification — {localSlip.fileName}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {localSlip?.status === "REJECTED" && (
        <div className="flex items-start gap-2 text-sm text-brand-red bg-red-50 rounded-md px-3 py-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>
            Your previous slip was rejected{localSlip.rejectionReason ? `: ${localSlip.rejectionReason}` : "."} Please
            upload a new one.
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <FileChooserInput ref={inputRef} accept="image/jpeg,image/png,application/pdf" />
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
