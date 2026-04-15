"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

interface ELConfig {
  configured: boolean;
  apiKey: string;
  voiceId: string;
}

interface Voice {
  id: string;
  name: string;
  category: string;
}

export function ElevenLabsSettings() {
  const { data: config, mutate } = useSWR<ELConfig>("/api/elevenlabs-config", fetcher);
  const { showToast } = useToast();

  const [apiKey, setApiKey] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [editing, setEditing] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);

  const save = async () => {
    try {
      await apiPost("/api/elevenlabs-config", {
        apiKey: apiKey || config?.apiKey || "",
        voiceId: voiceId || config?.voiceId || "",
      });
      showToast("ElevenLabs config saved", "success");
      mutate();
      setEditing(false);
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    }
  };

  const loadVoices = async () => {
    setLoadingVoices(true);
    try {
      const res = await fetch("/api/elevenlabs-voices");
      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
      } else {
        setVoices(data.voices || []);
      }
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    } finally {
      setLoadingVoices(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-purple-900 flex items-center justify-center text-[10px] font-bold text-purple-300">11</span>
          <span className="text-sm font-medium text-white">ElevenLabs TTS</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config?.configured ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-500"}`}>
          {config?.configured ? "Configured" : "Not set"}
        </span>
      </div>

      {!config?.configured || editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">API Key</label>
            <input
              type="password"
              value={apiKey || config?.apiKey || ""}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="xi-..."
              className="w-full bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700 font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Voice ID</label>
            <div className="flex gap-2">
              <input
                value={voiceId || config?.voiceId || ""}
                onChange={(e) => setVoiceId(e.target.value)}
                placeholder="Voice ID (optional)"
                className="flex-1 bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700 font-mono"
              />
              <button
                onClick={loadVoices}
                disabled={loadingVoices}
                className="px-2 py-1 text-[10px] bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                {loadingVoices ? "..." : "Browse"}
              </button>
            </div>
          </div>
          {voices.length > 0 && (
            <div className="max-h-32 overflow-auto border border-gray-700 rounded">
              {voices.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoiceId(v.id)}
                  className={`w-full text-left px-2 py-1 text-xs hover:bg-gray-800 ${voiceId === v.id ? "bg-gray-800 text-white" : "text-gray-400"}`}
                >
                  {v.name} <span className="text-gray-600">({v.category})</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={save} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button>
            {editing && (
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded">Cancel</button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <span className="text-xs text-gray-500">Voice: {config.voiceId || "default"}</span>
          <button onClick={() => setEditing(true)} className="ml-auto text-[10px] text-blue-400 hover:text-blue-300">Edit</button>
        </div>
      )}
    </div>
  );
}
