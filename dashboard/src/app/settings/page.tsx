"use client";

import { useChannelConfig, useChatChannels } from "@/hooks/useChannelConfig";
import { useCronStatus } from "@/hooks/useOverview";
import { CH_LABELS } from "@/lib/constants";
import { fmtTime } from "@/lib/format";
import { AIEngine } from "@/components/settings/AIEngine";
import { Notifications } from "@/components/settings/Notifications";
import { Account } from "@/components/settings/Account";
import { InteractiveChat } from "@/components/settings/InteractiveChat";
import Link from "next/link";

export default function SettingsPage() {
  const { data: channelConfig } = useChannelConfig();
  const { data: cronData } = useCronStatus();
  const { data: chatChannels } = useChatChannels();

  const cfg = (channelConfig || {}) as Record<string, { connected?: boolean; status?: string; userId?: string; keys?: Record<string, string> }>;
  const jobs = (((cronData as Record<string, unknown>)?.jobs || cronData || []) as Array<Record<string, unknown>>);

  return (
    <div className="px-8 py-6">
      <h2 className="text-xl font-semibold text-white mb-1">Settings</h2>
      <p className="text-sm text-gray-500 mb-6">Channel connections & system status</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connected Channels */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Connected Channels</h3>
          <div className="space-y-3">
            <Link href="/channels/threads" className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 cursor-pointer hover:bg-gray-800/50 block">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[8px] font-bold text-white">T</span>
                <div>
                  <p className="text-xs text-gray-300">Threads</p>
                  <p className="text-[10px] text-gray-600">{cfg.threads?.userId ? "ID: " + cfg.threads.userId : ""}</p>
                </div>
              </div>
              <span className={`text-[10px] ${cfg.threads?.connected ? "text-green-400" : "text-gray-600"}`}>
                {cfg.threads?.connected ? "Connected" : "Not connected"}
              </span>
            </Link>
            <Link href="/channels/x" className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 cursor-pointer hover:bg-gray-800/50 block">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-[9px] font-bold text-white">X</span>
                <div>
                  <p className="text-xs text-gray-300">X (Twitter)</p>
                  <p className="text-[10px] text-gray-600">{cfg.x?.connected ? "OAuth 1.0a" : ""}</p>
                </div>
              </div>
              <span className={`text-[10px] ${cfg.x?.connected ? "text-blue-400" : "text-gray-600"}`}>
                {cfg.x?.connected ? "Connected" : ""}
              </span>
            </Link>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 opacity-50">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-[8px] font-bold text-gray-500">IG</span>
                <div><p className="text-xs text-gray-500">Instagram</p></div>
              </div>
              <span className="text-[10px] text-gray-700">Coming soon</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 mt-4">Click a channel to manage its settings</p>
        </div>

        <div className="space-y-4">
          {/* System Status */}
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-4">System Status</h3>
            <div className="space-y-2.5">
              {jobs.map((j, i) => {
                const dot = j.lastStatus === "ok" ? "bg-green-500" : j.lastStatus === "error" ? "bg-red-500" : "bg-gray-600";
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                      <span className="text-xs text-gray-300">{String(j.name || "")}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {j.lastStatus === "error" ? (
                        <span className="text-red-400">error</span>
                      ) : (
                        j.nextRunAt ? fmtTime(j.nextRunAt) : ""
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Engine */}
          <AIEngine />

          {/* Account */}
          <Account />

          {/* Interactive Chat */}
          <InteractiveChat chatChannels={chatChannels as Record<string, { configured: boolean; botUsername?: string }> | undefined} />

          {/* Notifications */}
          <Notifications />
        </div>
      </div>
    </div>
  );
}
