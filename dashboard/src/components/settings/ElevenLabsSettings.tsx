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
  const [showApiKey, setShowApiKey] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);

  const apiKeyValue = apiKey || config?.apiKey || "";
  const voiceIdValue = voiceId || config?.voiceId || "";

  const save = async () => {
    try {
      await apiPost("/api/elevenlabs-config", {
        apiKey: apiKeyValue,
        voiceId: voiceIdValue,
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

  const isEditable = !config?.configured || editing;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-accent flex items-center justify-center text-caption font-bold text-accent">11</span>
          <span className="text-sm font-medium text-text">ElevenLabs TTS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-caption px-1.5 py-0.5 rounded-full ${config?.configured ? "bg-green-900/50 text-green-400" : "bg-surface-2 text-subtle"}`}>
            {config?.configured ? "Configured" : "Not set"}
          </span>
          {config?.configured && !editing && (
            <button onClick={() => setEditing(true)} className="text-caption text-accent hover:text-accent">Edit</button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-subtle block mb-0.5">API Key</label>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKeyValue}
              readOnly={!isEditable}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="xi-..."
              title={apiKeyValue}
              className={`w-full ${isEditable ? "bg-surface" : "bg-surface/50 cursor-default"} border border-border rounded px-3 py-2 pr-16 text-caption text-muted placeholder-gray-600 font-mono`}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-caption text-subtle hover:text-muted"
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs text-subtle block mb-0.5">Voice ID</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={voiceIdValue}
                readOnly={!isEditable}
                onChange={(e) => setVoiceId(e.target.value)}
                placeholder="Voice ID (optional)"
                title={voiceIdValue}
                className={`w-full ${isEditable ? "bg-surface" : "bg-surface/50 cursor-default"} border border-border rounded px-3 py-2 text-caption text-muted placeholder-gray-600 font-mono`}
              />
            </div>
            {isEditable && (
              <button
                onClick={loadVoices}
                disabled={loadingVoices}
                className="px-2 py-1 text-caption bg-surface-2 text-muted rounded hover:bg-surface-2"
              >
                {loadingVoices ? "..." : "Browse"}
              </button>
            )}
          </div>
        </div>
        {voices.length > 0 && isEditable && (
          <div className="max-h-32 overflow-auto border border-border rounded">
            {voices.map((v) => (
              <button
                key={v.id}
                onClick={() => setVoiceId(v.id)}
                className={`w-full text-left px-2 py-1 text-xs hover:bg-surface-2 ${voiceId === v.id ? "bg-surface-2 text-text" : "text-subtle"}`}
              >
                {v.name} <span className="text-subtle">({v.category})</span>
              </button>
            ))}
          </div>
        )}
        {isEditable && (
          <div className="flex gap-2">
            <button onClick={save} className="px-3 py-1.5 text-xs bg-accent text-text rounded hover:bg-accent-hover">
              {config?.configured ? "Update" : "Save"}
            </button>
            {editing && (
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs bg-surface-2 text-muted rounded">Cancel</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
