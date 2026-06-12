"use client";

import { useState } from "react";
import { ChannelsSettings } from "@/components/settings/ChannelsSettings";
import { ChannelConnect } from "@/components/studio/ChannelConnect";
import { useUIStore } from "@/store/ui-store";
import { AIEngine } from "@/components/settings/AIEngine";
import { LlmModel } from "@/components/settings/LlmModel";
import { ClaudeToken } from "@/components/settings/ClaudeToken";
import { StorageSettings } from "@/components/settings/StorageSettings";
import { DesignToolsSettings } from "@/components/settings/DesignToolsSettings";
import { SystemSettings } from "@/components/settings/SystemSettings";
import { SlackSettings } from "@/components/settings/SlackSettings";
import { ElevenLabsSettings } from "@/components/settings/ElevenLabsSettings";
import { KeywordBankSettings } from "@/components/settings/KeywordBankSettings";
import { KwPlannerSettings } from "@/components/settings/KwPlannerSettings";

const SETTINGS_TABS = [
  { key: "channels", label: "Channels", desc: "발행 채널 연결" },
  { key: "ai", label: "AI Engine", desc: "LLM 모델 + 토큰" },
  { key: "storage", label: "Storage", desc: "이미지 저장소" },
  { key: "design", label: "Design Tools", desc: "Canva / Figma" },
  { key: "notifications", label: "Notifications", desc: "Slack 알림" },
  { key: "keywords", label: "Keywords", desc: "키워드 뱅크 + API" },
  { key: "video", label: "Video / TTS", desc: "ElevenLabs 설정" },
  { key: "system", label: "System", desc: "크론 + 계정" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("channels");
  const { activeWorkspace } = useUIStore();
  const [showConnect, setShowConnect] = useState(false);

  return (
    <div className="px-8 py-6">
      <h2 className="text-xl font-semibold text-white mb-1">Settings</h2>
      <p className="text-sm text-gray-500 mb-6">서비스 설정 -- 각 항목이 어디에서 사용되는지 확인하세요</p>
      <div className="flex gap-1 mb-6 border-b border-gray-800/50 pb-3 flex-wrap">
        {SETTINGS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 text-sm rounded ${activeTab === t.key ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "channels" && (
        <>
          {/* OSMU 테넌트 발행용 채널 토큰(integrations) — 워크스페이스별 */}
          <div className="mb-6 p-4 rounded-xl border border-purple-500/30 bg-purple-900/10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-purple-200">OSMU 채널 토큰 {activeWorkspace?.name ? `· ${activeWorkspace.name}` : ""}</h3>
              <p className="text-xs text-gray-500 mt-0.5">활성 워크스페이스의 발행용 채널 토큰(Threads/Instagram)을 연결합니다. Studio 발행이 이 토큰을 사용합니다.</p>
            </div>
            <button onClick={() => setShowConnect(true)} disabled={!activeWorkspace}
              className="px-3 py-2 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg disabled:opacity-50 whitespace-nowrap">🔗 채널 토큰 연결</button>
          </div>
          <ChannelsSettings />
        </>
      )}
      {showConnect && activeWorkspace && <ChannelConnect workspace={activeWorkspace} onClose={() => setShowConnect(false)} />}
      {activeTab === "ai" && (
        <>
          <p className="text-[10px] text-gray-500 mb-4">모든 채널의 콘텐츠 자동 생성 + 트렌드 분석에 사용됩니다.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <LlmModel />
            <ClaudeToken />
          </div>
          <AIEngine />
        </>
      )}
      {activeTab === "storage" && <StorageSettings />}
      {activeTab === "design" && <DesignToolsSettings />}
      {activeTab === "notifications" && <SlackSettings />}
      {activeTab === "keywords" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KeywordBankSettings />
          <KwPlannerSettings />
        </div>
      )}
      {activeTab === "video" && (
        <div className="max-w-lg">
          <ElevenLabsSettings />
        </div>
      )}
      {activeTab === "system" && <SystemSettings />}
    </div>
  );
}
