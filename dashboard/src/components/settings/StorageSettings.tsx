"use client";

import { useState } from "react";
import { useR2Config } from "@/hooks/useChannelConfig";
import { apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

function CredField({ id, label, isSecret, value, editable }: {
  id: string; label: string; isSecret?: boolean; value: string; editable: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-0.5">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isSecret && !show ? "password" : "text"}
          defaultValue={value}
          placeholder={label}
          readOnly={!editable}
          className={`w-full ${editable ? "bg-gray-900" : "bg-gray-900/50 cursor-default"} border border-gray-700 rounded px-3 py-2 pr-16 text-[11px] text-gray-300 placeholder-gray-600 font-mono`}
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-gray-300"
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
    </div>
  );
}

export function StorageSettings() {
  const { data, mutate } = useR2Config();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const r2 = (data || {}) as Record<string, string>;
  const r2Connected = !!(r2.bucket && r2.accessKeyId);
  const editable = editing || !r2Connected;

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      accessKeyId: (document.getElementById("r2-access-key") as HTMLInputElement)?.value?.trim(),
      secretAccessKey: (document.getElementById("r2-secret-key") as HTMLInputElement)?.value?.trim(),
      bucket: (document.getElementById("r2-bucket") as HTMLInputElement)?.value?.trim(),
      endpoint: (document.getElementById("r2-endpoint") as HTMLInputElement)?.value?.trim(),
      publicUrl: (document.getElementById("r2-public-url") as HTMLInputElement)?.value?.trim(),
    };
    try {
      const r = await apiPost<{ ok: boolean }>("/api/r2-config", payload);
      if (r?.ok) {
        showToast("R2 Storage 설정 저장됨", "success");
        setEditing(false);
        mutate();
      }
    } catch (e) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <p className="text-[10px] text-gray-500 mb-4">Instagram, Threads 등 이미지 발행 시 공용 업로드 저장소. 모든 채널에서 사용됩니다.</p>
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Cloudflare R2</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded ${r2Connected ? "bg-green-900/40 text-green-400" : "bg-yellow-900/40 text-yellow-400"}`}>
            {r2Connected ? "Connected" : "Not configured"}
          </span>
        </div>
        <details className="mb-3 text-[10px]">
          <summary className="text-blue-400 hover:text-blue-300 cursor-pointer">Setup Guide -- R2 설정법</summary>
          <div className="mt-2 p-3 rounded bg-gray-900/50 text-gray-500 space-y-1.5">
            <p className="font-medium text-gray-400">1. 버킷 생성</p>
            <p className="pl-3">dash.cloudflare.com &gt; R2 &gt; Create bucket</p>
            <p className="font-medium text-gray-400">2. 퍼블릭 액세스</p>
            <p className="pl-3">버킷 &gt; Settings &gt; Public Development URL &gt; Enable &gt; <code className="bg-gray-800 px-1 rounded">allow</code> 입력</p>
            <p className="font-medium text-gray-400">3. API 토큰</p>
            <p className="pl-3">R2 Overview &gt; Account Details &gt; S3 API &gt; Manage &gt; Create Account API token</p>
            <p className="pl-3">Permission: Object Read &amp; Write, Bucket 선택, TTL 기본값</p>
            <p className="pl-3 text-yellow-500">Secret Access Key는 생성 시 한 번만 표시됨</p>
            <p className="font-medium text-gray-400">4. 아래 입력</p>
            <p className="pl-3">Access Key ID, Secret, Bucket, S3 Endpoint, Public URL</p>
          </div>
        </details>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-gray-500">Credentials</span>
          {r2Connected && !editing && (
            <button onClick={() => setEditing(true)} className="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CredField id="r2-access-key" label="Access Key ID" value={r2.accessKeyId || ""} editable={editable} />
          <CredField id="r2-secret-key" label="Secret Access Key" isSecret value={r2.secretAccessKey || ""} editable={editable} />
          <CredField id="r2-bucket" label="Bucket Name" value={r2.bucket || ""} editable={editable} />
          <CredField id="r2-endpoint" label="S3 Endpoint" value={r2.endpoint || ""} editable={editable} />
          <CredField id="r2-public-url" label="Public URL" value={r2.publicUrl || ""} editable={editable} />
        </div>
        {editable && (
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 disabled:opacity-50">
              {saving ? "Saving..." : r2Connected ? "Update" : "Connect"}
            </button>
            {r2Connected && editing && (
              <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">Cancel</button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
