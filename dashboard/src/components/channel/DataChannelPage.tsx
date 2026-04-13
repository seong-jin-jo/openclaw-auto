"use client";

import { useChannelConfig } from "@/hooks/useChannelConfig";
import { apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";
import { CH_LABELS, CH_STATUS_LABEL } from "@/lib/constants";
import { setupGuides } from "@/lib/setup-guides";
import { CredentialForm } from "@/components/shared/CredentialForm";
import { SetupGuide } from "@/components/shared/SetupGuide";
import Link from "next/link";

interface DataChannelPageProps {
  channel: string;
}

export function DataChannelPage({ channel }: DataChannelPageProps) {
  const label = CH_LABELS[channel] || channel;
  const { data: channelConfig, mutate: mutateConfig } = useChannelConfig();
  const { showToast } = useToast();

  const cfg = channelConfig?.[channel];
  const status = cfg?.status || "available";
  const keys = cfg?.keys || {};
  const sg = setupGuides[channel] || { fields: [], labels: [], quick: ["Setup guide 준비 중"], detail: "" };

  const handleCredSave = async (newKeys: Record<string, string>) => {
    const r = await apiPost<{ verified?: boolean; error?: string; account?: string }>(`/api/channel-config/${channel}`, newKeys);
    if (r?.verified) {
      showToast(`${label} 연결 완료${r.account ? " — " + r.account : ""}`, "success");
      mutateConfig();
    } else {
      showToast(`연결 실패: ${r?.error || "Invalid credentials"}`, "error");
      throw new Error(r?.error || "Verification failed");
    }
  };

  return (
    <div className="px-8 py-6">
      <Link href="/" className="text-gray-600 hover:text-gray-400 text-sm mb-1 inline-block">
        &larr; Back
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <span className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-white">
          {label[0]}
        </span>
        <div>
          <h2 className="text-xl font-semibold text-gray-200">{label}</h2>
          <p className="text-xs text-gray-600">{CH_STATUS_LABEL[status] || status}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5">
          <CredentialForm
            channelKey={channel}
            fields={sg.fields}
            labels={sg.labels}
            currentKeys={keys}
            onSave={handleCredSave}
          />
        </div>
        <div className="card p-5">
          <SetupGuide quick={sg.quick} detail={sg.detail} />
        </div>
      </div>
    </div>
  );
}
