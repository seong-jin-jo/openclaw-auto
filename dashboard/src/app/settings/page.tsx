"use client";

import { useState } from "react";
import { ChannelsSettings } from "@/components/settings/ChannelsSettings";
import { AIEngine } from "@/components/settings/AIEngine";
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

      {activeTab === "channels" && <ChannelsSettings />}
      {activeTab === "ai" && (
        <>
          <p className="text-[10px] text-gray-500 mb-4">모든 채널의 콘텐츠 자동 생성 + 트렌드 분석에 사용됩니다.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AIEngine />
            <ClaudeToken />
          </div>
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
