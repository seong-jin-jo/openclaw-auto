"use client";

import { useNotifSettings } from "@/hooks/useChannelConfig";

interface NotifStatusCardProps {
  channel: string;
}

const EVENT_LABELS: Record<string, string> = {
  onPublish: "글 발행 시",
  onViral: "바이럴 감지 시",
  onError: "크론 에러 시",
  weeklyReport: "주간 리포트",
};

export function NotifStatusCard({ channel }: NotifStatusCardProps) {
  const { data: settings } = useNotifSettings();

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-gray-200 mb-3">알림 발송</h3>
      <p className="text-[10px] text-gray-600 mb-3">
        이 채널로 마케팅 알림을 자동 발송할 수 있습니다.
      </p>
      <div className="space-y-2">
        {Object.entries(EVENT_LABELS).map(([evt, label]) => {
          const enabled = settings?.[evt as keyof typeof settings]?.channels?.includes(channel);
          return (
            <div key={evt} className="flex items-center justify-between p-2 rounded bg-gray-900/50">
              <span className="text-xs text-gray-600">{label}</span>
              <span className={`text-[10px] ${enabled ? "text-green-400" : "text-gray-600"}`}>
                {enabled ? "ON" : "OFF"}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-600 mt-2">Settings &gt; Notifications에서 변경</p>
    </div>
  );
}
