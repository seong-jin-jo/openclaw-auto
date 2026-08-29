import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// 회귀 방지: OpenClaw agent 도구(threads_insights, action=cleanup_low_engagement)는
// 승낙 없이 Threads 글을 삭제해서는 안 된다(회장 지시 2026-08-29).
// 실제 삭제는 대시보드 승낙형 경로(GET low-engagement-candidates → POST
// low-engagement-cleanup, 사람이 고른 postId만)로만 일어나야 한다.
//
// 이 테스트는 두 소스 트리를 모두 정적으로 검사한다:
//  - extensions/threads-insights (신규 기능이 얹히는 활성 개발 트리)
//  - openclaw/extensions/threads-insights (docker-compose.postagi-4tenants.yml의
//    실제 gateway 빌드 컨텍스트 ./openclaw 가 사용하는 번들 사본, 2026-08 시점 기준
//    cleanup_low_engagement 액션 자체가 없어 안전하지만, 회귀 시 나란히 검사)
//
// 도구 소스가 OpenClaw plugin-sdk에 의존해 vitest에서 직접 import/실행이 어려우므로
// 소스 텍스트를 정적 분석해 "삭제 없는" 불변조건을 강제한다.

const REPO_ROOT = path.resolve(__dirname, '../../..');

function readIfExists(relPath: string): string | null {
  const abs = path.join(REPO_ROOT, relPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf-8');
}

function extractFunctionBody(src: string, fnName: string): string | null {
  const start = src.indexOf(`function ${fnName}(`);
  if (start === -1) return null;
  // 함수 시작부터 같은 들여쓰기의 닫는 '}\n' 까지 대략적으로 추출(중첩 브레이스 카운팅).
  let depth = 0;
  let i = src.indexOf('{', start);
  const bodyStart = i;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(bodyStart, i + 1);
    }
  }
  return null;
}

describe('threads_insights agent tool: cleanup_low_engagement는 승낙 없이 삭제하지 않는다', () => {
  it('extensions/threads-insights: cleanupLowEngagement가 Threads DELETE를 호출하지 않는다', () => {
    const src = readIfExists('extensions/threads-insights/src/threads-insights-tool.ts');
    expect(src, 'root extensions/threads-insights 소스를 찾을 수 없습니다').not.toBeNull();

    const body = extractFunctionBody(src!, 'cleanupLowEngagement');
    expect(body, 'cleanupLowEngagement 함수를 찾을 수 없습니다').not.toBeNull();

    // 과거 사고: 이 함수가 fetch(..., { method: "DELETE" })로 즉시 삭제했다.
    expect(body).not.toMatch(/method:\s*["']DELETE["']/);
    // 큐 상태를 직접 "failed"/삭제로 갱신해서도 안 된다(승낙 경로만 큐를 갱신).
    expect(body).not.toMatch(/writeJson\(config\.queuePath/);
    // 후보만 반환하는 안전한 계약을 유지하는지 확인.
    expect(body).toMatch(/requiresHumanConsent/);
  });

  it('extensions/threads-insights: 도구 스키마 설명에 삭제 없음이 명시돼 있다', () => {
    const src = readIfExists('extensions/threads-insights/src/threads-insights-tool.ts');
    expect(src).not.toBeNull();
    expect(src).toMatch(/cleanup_low_engagement[\s\S]{0,400}삭제 없음|저조 후보만 조회/);
  });

  it('openclaw/extensions/threads-insights(실제 docker 빌드 컨텍스트 사본): DELETE 삭제 경로가 없다', () => {
    const src = readIfExists('openclaw/extensions/threads-insights/src/threads-insights-tool.ts');
    if (src === null) {
      // 사본 자체가 없으면(향후 구조 변경) 이 케이스는 무관 — 통과.
      return;
    }
    // 이 사본은 cleanup_low_engagement 액션 자체가 없는 것이 2026-08 기준 안전한 상태다.
    // 만약 누군가 이 액션을 여기에도 이식한다면, 반드시 DELETE 호출이 없어야 한다.
    if (src.includes('cleanup_low_engagement')) {
      const body = extractFunctionBody(src, 'cleanupLowEngagement');
      if (body) {
        expect(body).not.toMatch(/method:\s*["']DELETE["']/);
      }
    } else {
      expect(src).not.toMatch(/method:\s*["']DELETE["']/);
    }
  });
});
