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
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${kwCfg?.configured ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-500"}`}>
            {kwCfg?.configured ? "Connected" : "Not set"}
          </span>
        </div>
        {!kwCfg?.configured || editingKw ? (
          <div className="space-y-2">
            <input
              value={kwForm.clientId ?? kwCfg?.clientId ?? ""}
              onChange={(e) => setKwForm({ ...kwForm, clientId: e.target.value })}
              placeholder="API Key (Client ID)"
              className="w-full bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700 font-mono"
            />
            <input
              type="password"
              value={kwForm.clientSecret ?? kwCfg?.clientSecret ?? ""}
              onChange={(e) => setKwForm({ ...kwForm, clientSecret: e.target.value })}
              placeholder="Secret Key"
              className="w-full bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700 font-mono"
            />
            <input
              value={kwForm.customerId ?? kwCfg?.customerId ?? ""}
              onChange={(e) => setKwForm({ ...kwForm, customerId: e.target.value })}
              placeholder="Customer ID"
              className="w-full bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700 font-mono"
            />
            <p className="text-[10px] text-gray-600">searchad.naver.com &rarr; Tools &rarr; API &rarr; Credentials</p>
            <div className="flex gap-2">
              <button onClick={saveKw} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button>
              {editingKw && <button onClick={() => setEditingKw(false)} className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded">Cancel</button>}
            </div>
          </div>
        ) : (
          <button onClick={() => setEditingKw(true)} className="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>
        )}
      </div>

      {/* Naver Datalab */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-green-900 flex items-center justify-center text-[10px] font-bold text-green-300">D</span>
            <span className="text-sm font-medium text-white">Naver Datalab</span>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${dlCfg?.configured ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-500"}`}>
            {dlCfg?.configured ? "Connected" : "Not set"}
          </span>
        </div>
        {!dlCfg?.configured || editingDl ? (
          <div className="space-y-2">
            <input
              value={dlForm.clientId ?? dlCfg?.clientId ?? ""}
              onChange={(e) => setDlForm({ ...dlForm, clientId: e.target.value })}
              placeholder="Client ID"
              className="w-full bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700 font-mono"
            />
            <input
              type="password"
              value={dlForm.clientSecret ?? dlCfg?.clientSecret ?? ""}
              onChange={(e) => setDlForm({ ...dlForm, clientSecret: e.target.value })}
              placeholder="Client Secret"
              className="w-full bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700 font-mono"
            />
            <p className="text-[10px] text-gray-600">developers.naver.com &rarr; Application &rarr; Datalab</p>
            <div className="flex gap-2">
              <button onClick={saveDl} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button>
              {editingDl && <button onClick={() => setEditingDl(false)} className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded">Cancel</button>}
            </div>
          </div>
        ) : (
          <button onClick={() => setEditingDl(true)} className="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>
        )}
      </div>
    </div>
  );
}
