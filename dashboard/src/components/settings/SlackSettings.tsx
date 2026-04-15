"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

interface SlackConfig {
  configured: boolean;
  webhookUrl: string;
}

interface SlackTemplate {
  template: string;
}

interface SlackReportPreview {
  report: string;
  variables: Record<string, string | number>;
}

export function SlackSettings() {
  const { data: config, mutate: mutateConfig } = useSWR<SlackConfig>("/api/slack-config", fetcher);
  const { data: tmpl, mutate: mutateTmpl } = useSWR<SlackTemplate>("/api/slack-template", fetcher);
  const { showToast } = useToast();

  const [webhookUrl, setWebhookUrl] = useState("");
  const [editing, setEditing] = useState(false);
  const [template, setTemplate] = useState("");
  const [editingTmpl, setEditingTmpl] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const saveWebhook = async () => {
    try {
      await apiPost("/api/slack-config", { webhookUrl });
      showToast("Slack webhook saved", "success");
      mutateConfig();
      setEditing(false);
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    }
  };

  const testWebhook = async () => {
    try {
      await apiPost("/api/slack-test");
      showToast("Test message sent", "success");
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    }
  };

  const saveTemplate = async () => {
    try {
      await apiPost("/api/slack-template", { template });
      showToast("Template saved", "success");
      mutateTmpl();
      setEditingTmpl(false);
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    }
  };

  const loadPreview = async () => {
    try {
      const res = await fetch("/api/slack-report-preview");
      const data: SlackReportPreview = await res.json();
      setPreview(data.report);
    } catch {
      setPreview("Failed to generate preview");
    }
  };

  const sendReport = async () => {
    setSending(true);
    try {
      await apiPost("/api/slack-send-custom");
      showToast("Report sent to Slack", "success");
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-white">Slack Notifications</h3>

      {/* Webhook Config */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">Webhook URL</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config?.configured ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-500"}`}>
            {config?.configured ? "Connected" : "Not set"}
          </span>
        </div>
        {!config?.configured || editing ? (
          <div className="space-y-2">
            <input
              value={webhookUrl || config?.webhookUrl || ""}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700 font-mono"
            />
            <div className="flex gap-2">
              <button onClick={saveWebhook} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button>
              {editing && (
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded">Cancel</button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={testWebhook} className="px-3 py-1.5 text-xs bg-green-700 text-white rounded hover:bg-green-600">Test</button>
            <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">Edit</button>
          </div>
        )}
      </div>

      {/* Template */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">Report Template</span>
          {!editingTmpl && (
            <button onClick={() => { setTemplate(tmpl?.template || ""); setEditingTmpl(true); }} className="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>
          )}
        </div>
        {editingTmpl ? (
          <div className="space-y-2">
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={10}
              className="w-full bg-gray-800 text-gray-200 text-xs p-3 rounded border border-gray-700 font-mono"
            />
            <p className="text-[10px] text-gray-600">
              Variables: {"{blog_articles}"}, {"{blog_views}"}, {"{blog_delta}"}, {"{blog_top}"},
              {"{gsc_clicks}"}, {"{gsc_impressions}"}, {"{gsc_ctr}"}, {"{gsc_top_keywords}"},
              {"{ga_sessions}"}, {"{ga_pageviews}"}, {"{dashboard_url}"}
            </p>
            <div className="flex gap-2">
              <button onClick={saveTemplate} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button>
              <button onClick={() => setEditingTmpl(false)} className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded">Cancel</button>
            </div>
          </div>
        ) : (
          <pre className="text-[10px] text-gray-500 whitespace-pre-wrap max-h-32 overflow-auto">{tmpl?.template?.slice(0, 300)}...</pre>
        )}
      </div>

      {/* Preview & Send */}
      {config?.configured && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-400">Report Preview & Send</span>
          </div>
          <div className="flex gap-2 mb-3">
            <button onClick={loadPreview} className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">Preview Report</button>
            <button onClick={sendReport} disabled={sending} className="px-3 py-1.5 text-xs bg-purple-700 text-white rounded hover:bg-purple-600 disabled:opacity-50">
              {sending ? "Sending..." : "Send to Slack"}
            </button>
          </div>
          {preview && (
            <pre className="bg-gray-800 text-gray-300 text-[10px] p-3 rounded whitespace-pre-wrap max-h-48 overflow-auto">{preview}</pre>
          )}
        </div>
      )}
    </div>
  );
}
