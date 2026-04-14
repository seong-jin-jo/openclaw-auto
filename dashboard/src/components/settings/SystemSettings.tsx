"use client";

import { useCronStatus } from "@/hooks/useOverview";
import { fmtTime } from "@/lib/format";
import { Account } from "./Account";
import { Notifications } from "./Notifications";

export function SystemSettings() {
  const { data: cronData } = useCronStatus();
  const jobs = (((cronData as Record<string, unknown>)?.jobs || cronData || []) as Array<Record<string, unknown>>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Cron Status</h3>
        <p className="text-[10px] text-gray-500 mb-3">자동화 작업 실행 현황</p>
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
      <div className="space-y-4">
        <Account />
        <Notifications />
      </div>
    </div>
  );
}
