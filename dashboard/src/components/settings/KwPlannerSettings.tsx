"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

interface KwConfig {
  configured: boolean;
  clientId: string;
  clientSecret: string;
  customerId: string;
}

interface DatalabConfig {
  configured: boolean;
  clientId: string;
  clientSecret: string;
}

export function KwPlannerSettings() {
  const { data: kwCfg, mutate: mutateKw } = useSWR<KwConfig>("/api/kw-planner-config", fetcher);
  const { data: dlCfg, mutate: mutateDl } = useSWR<DatalabConfig>("/api/naver-datalab-config", fetcher);
  const { showToast } = useToast();

  const [kwForm, setKwForm] = useState<Partial<KwConfig>>({});
  const [dlForm, setDlForm] = useState<Partial<DatalabConfig>>({});
  const [editingKw, setEditingKw] = useState(false);
  const [editingDl, setEditingDl] = useState(false);
  const [showKwSecret, setShowKwSecret] = useState(false);
  const [showDlSecret, setShowDlSecret] = useState(false);

  const saveKw = async () => {
    try {
      await apiPost("/api/kw-planner-config", {
        clientId: kwForm.clientId || kwCfg?.clientId || "",
        clientSecret: kwForm.clientSecret || kwCfg?.clientSecret || "",
        customerId: kwForm.customerId || kwCfg?.customerId || "",
      });
      showToast("Keyword Planner config saved", "success");
      mutateKw();
      setEditingKw(false);
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    }
  };

  const saveDl = async () => {
    try {
      await apiPost("/api/naver-datalab-config", {
        clientId: dlForm.clientId || dlCfg?.clientId || "",
        clientSecret: dlForm.clientSecret || dlCfg?.clientSecret || "",
      });
      showToast("Naver Datalab config saved", "success");
      mutateDl();
      setEditingDl(false);
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Naver Search Ad (Keyword Planner) */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-green-900 flex items-center justify-center text-[10px] font-bold text-green-300">N</span>
            <span className="text-sm font-medium text-white">Naver Keyword Planner</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${kwCfg?.configured ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-500"}`}>
              {kwCfg?.configured ? "Connected" : "Not set"}
            </span>
            {kwCfg?.configured && !editingKw && (
              <button onClick={() => setEditingKw(true)} className="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>
            )}
          </div>
        </div>
        {(() => {
          const isEditable = !kwCfg?.configured || editingKw;
          const clientIdVal = kwForm.clientId ?? kwCfg?.clientId ?? "";
          const clientSecretVal = kwForm.clientSecret ?? kwCfg?.clientSecret ?? "";
          const customerIdVal = kwForm.customerId ?? kwCfg?.customerId ?? "";
          return (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">API Key (Client ID)</label>
                <input
                  value={clientIdVal}
                  readOnly={!isEditable}
                  onChange={(e) => setKwForm({ ...kwForm, clientId: e.target.value })}
                  placeholder="API Key (Client ID)"
                  title={clientIdVal}
                  className={`w-full ${isEditable ? "bg-gray-900" : "bg-gray-900/50 cursor-default"} border border-gray-700 rounded px-3 py-2 text-[11px] text-gray-300 placeholder-gray-600 font-mono`}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Secret Key</label>
                <div className="relative">
                  <input
                    type={showKwSecret ? "text" : "password"}
                    value={clientSecretVal}
                    readOnly={!isEditable}
                    onChange={(e) => setKwForm({ ...kwForm, clientSecret: e.target.value })}
                    placeholder="Secret Key"
                    title={clientSecretVal}
                    className={`w-full ${isEditable ? "bg-gray-900" : "bg-gray-900/50 cursor-default"} border border-gray-700 rounded px-3 py-2 pr-16 text-[11px] text-gray-300 placeholder-gray-600 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKwSecret(!showKwSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-gray-300"
                  >
                    {showKwSecret ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Customer ID</label>
                <input
                  value={customerIdVal}
                  readOnly={!isEditable}
                  onChange={(e) => setKwForm({ ...kwForm, customerId: e.target.value })}
                  placeholder="Customer ID"
                  title={customerIdVal}
                  className={`w-full ${isEditable ? "bg-gray-900" : "bg-gray-900/50 cursor-default"} border border-gray-700 rounded px-3 py-2 text-[11px] text-gray-300 placeholder-gray-600 font-mono`}
                />
              </div>
              <p className="text-[10px] text-gray-600">searchad.naver.com &rarr; Tools &rarr; API &rarr; Credentials</p>
              {isEditable && (
                <div className="flex gap-2">
                  <button onClick={saveKw} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">
                    {kwCfg?.configured ? "Update" : "Save"}
                  </button>
                  {editingKw && <button onClick={() => setEditingKw(false)} className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded">Cancel</button>}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Naver Datalab */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-green-900 flex items-center justify-center text-[10px] font-bold text-green-300">D</span>
            <span className="text-sm font-medium text-white">Naver Datalab</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${dlCfg?.configured ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-500"}`}>
              {dlCfg?.configured ? "Connected" : "Not set"}
            </span>
            {dlCfg?.configured && !editingDl && (
              <button onClick={() => setEditingDl(true)} className="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>
            )}
          </div>
        </div>
        {(() => {
          const isEditable = !dlCfg?.configured || editingDl;
          const clientIdVal = dlForm.clientId ?? dlCfg?.clientId ?? "";
          const clientSecretVal = dlForm.clientSecret ?? dlCfg?.clientSecret ?? "";
          return (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Client ID</label>
                <input
                  value={clientIdVal}
                  readOnly={!isEditable}
                  onChange={(e) => setDlForm({ ...dlForm, clientId: e.target.value })}
                  placeholder="Client ID"
                  title={clientIdVal}
                  className={`w-full ${isEditable ? "bg-gray-900" : "bg-gray-900/50 cursor-default"} border border-gray-700 rounded px-3 py-2 text-[11px] text-gray-300 placeholder-gray-600 font-mono`}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Client Secret</label>
                <div className="relative">
                  <input
                    type={showDlSecret ? "text" : "password"}
                    value={clientSecretVal}
                    readOnly={!isEditable}
                    onChange={(e) => setDlForm({ ...dlForm, clientSecret: e.target.value })}
                    placeholder="Client Secret"
                    title={clientSecretVal}
                    className={`w-full ${isEditable ? "bg-gray-900" : "bg-gray-900/50 cursor-default"} border border-gray-700 rounded px-3 py-2 pr-16 text-[11px] text-gray-300 placeholder-gray-600 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDlSecret(!showDlSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-gray-300"
                  >
                    {showDlSecret ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-gray-600">developers.naver.com &rarr; Application &rarr; Datalab</p>
              {isEditable && (
                <div className="flex gap-2">
                  <button onClick={saveDl} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">
                    {dlCfg?.configured ? "Update" : "Save"}
                  </button>
                  {editingDl && <button onClick={() => setEditingDl(false)} className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded">Cancel</button>}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
