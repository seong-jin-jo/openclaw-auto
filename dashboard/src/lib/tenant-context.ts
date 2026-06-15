import { AsyncLocalStorage } from "node:async_hooks";

// 요청별 "현재 테넌트" 컨텍스트. 레거시 파일기반 라우트를 테넌트별로 격리하는 핵심.
// 라우트 핸들러를 runWithTenant(tenantId, fn)로 감싸면, 그 안에서 호출되는 모든
// file-io(dataPath/configPath)가 자동으로 data/tenants/{tenantId}/ 아래를 읽고 쓴다.
// tenantId=null(운영자/중앙 도메인)이면 공유 루트(레거시 단일테넌트 동작 유지).
const als = new AsyncLocalStorage<{ tenantId: string | null }>();

export function runWithTenant<T>(tenantId: string | null, fn: () => T): T {
  return als.run({ tenantId }, fn);
}

export function currentTenantId(): string | null {
  return als.getStore()?.tenantId ?? null;
}
