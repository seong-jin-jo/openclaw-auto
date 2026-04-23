import { readJson, dataPath, configPath } from "@/lib/file-io";

export async function GET() {
  const queue = readJson<{ posts: Array<Record<string, unknown>> }>(dataPath("queue.json")) || { posts: [] };
  const posts = queue.posts || [];
  const now = Date.now();
  const weekAgoMs = now - 7 * 24 * 3600 * 1000;

  // 날짜 범위
  const startDate = new Date(weekAgoMs);
  const endDate = new Date(now);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  const dateRange = `${fmt(startDate)} ~ ${fmt(endDate)}`;

  // 이번 주 발행 글
  const weekPublished = posts.filter(p => {
    const at = p.publishedAt as string;
    return at && new Date(at).getTime() > weekAgoMs;
  });

  // 이번 주 생성 글
  const weekDrafted = posts.filter(p => {
    const at = (p.generatedAt || p.createdAt) as string;
    return at && new Date(at).getTime() > weekAgoMs;
  });

  // 성과 집계
  const totalViews = weekPublished.reduce((s, p) => {
    const eng = (p.engagement as Record<string, number>) || {};
    return s + (eng.views || 0);
  }, 0);
  const totalLikes = weekPublished.reduce((s, p) => {
    const eng = (p.engagement as Record<string, number>) || {};
    return s + (eng.likes || 0);
  }, 0);
  const totalReplies = weekPublished.reduce((s, p) => {
    const eng = (p.engagement as Record<string, number>) || {};
    return s + (eng.replies || 0);
  }, 0);

  // 채널별 분류
  const channels: Record<string, number> = {};
  for (const p of weekPublished) {
    const ch = (p.channels as Record<string, Record<string, unknown>>) || {};
    for (const [key, val] of Object.entries(ch)) {
      if (val?.status === "published") channels[key] = (channels[key] || 0) + 1;
    }
  }
  if (Object.keys(channels).length === 0 && weekPublished.length > 0) {
    channels["threads"] = weekPublished.length;
  }

  // 팔로워
  const growth = readJson<{ records: Array<{ followers: number }> }>(dataPath("growth.json")) || { records: [] };
  const records = growth.records || [];
  const followers = records.length ? records[records.length - 1].followers : 0;
  const weekDelta = records.length >= 7
    ? records[records.length - 1].followers - records[Math.max(0, records.length - 7)].followers
    : 0;

  // 바이럴
  const settings = readJson<Record<string, number>>(dataPath("settings.json")) || {};
  const vt = settings.viralThreshold || 500;
  const viral = weekPublished
    .filter(p => ((p.engagement as Record<string, number>)?.views || 0) >= vt)
    .sort((a, b) => ((b.engagement as Record<string, number>)?.views || 0) - ((a.engagement as Record<string, number>)?.views || 0));

  // 크론 상태
  const cronData = readJson<{ jobs: Array<Record<string, unknown>> }>(configPath("cron", "jobs.json")) || { jobs: [] };
  let cronOk = 0, cronErr = 0;
  for (const j of cronData.jobs || []) {
    const state = (j.state as Record<string, unknown>) || {};
    if (state.lastRunStatus === "ok") cronOk++;
    else if (state.lastRunStatus === "error") cronErr++;
  }

  const engRate = totalViews > 0 ? Math.round((totalLikes + totalReplies) / totalViews * 1000) / 10 : 0;
  const channelStr = Object.entries(channels).map(([k, v]) => `${k}: ${v}건`).join(" | ") || "-";

  // 리포트 텍스트
  let report = `📊 주간 마케팅 리포트 (${dateRange})

📝 콘텐츠
  발행: ${weekPublished.length}건 | 생성: ${weekDrafted.length}건
  ${channelStr}

📈 성과
  조회: ${totalViews.toLocaleString()} | 좋아요: ${totalLikes} | 댓글: ${totalReplies}
  참여율: ${engRate}%

👥 팔로워
  현재: ${followers.toLocaleString()}명 (${weekDelta >= 0 ? "+" : ""}${weekDelta} 이번 주)

⚙️ 자동화
  크론 정상: ${cronOk}/${cronOk + cronErr}${cronErr > 0 ? ` | 에러: ${cronErr}` : ""}`;

  if (viral.length > 0) {
    report += `\n\n🔥 터진 글 (${viral.length}건)`;
    for (const v of viral.slice(0, 3)) {
      const views = (v.engagement as Record<string, number>)?.views || 0;
      const likes = (v.engagement as Record<string, number>)?.likes || 0;
      report += `\n  "${(v.text as string).slice(0, 40)}..." — 조회 ${views.toLocaleString()} / 좋아요 ${likes}`;
    }
  }

  return Response.json({
    report,
    dateRange,
    stats: {
      published: weekPublished.length,
      drafted: weekDrafted.length,
      views: totalViews,
      likes: totalLikes,
      replies: totalReplies,
      engRate,
      followers,
      weekDelta,
      viral: viral.length,
      channels,
      cronOk,
      cronErr,
    },
  });
}
