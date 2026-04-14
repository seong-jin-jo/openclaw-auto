"use client";

import { useState } from "react";
import { useDesignTools } from "@/hooks/useChannelConfig";
import { apiPost, fetcher } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

function CredField({ id, label, isSecret, value, editable }: {
  id: string; label: string; isSecret?: boolean; value: string; editable: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-0.5">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isSecret && !show ? "password" : "text"}
          defaultValue={value}
          placeholder={label}
          readOnly={!editable}
          className={`w-full ${editable ? "bg-gray-900" : "bg-gray-900/50 cursor-default"} border border-gray-700 rounded px-3 py-2 pr-16 text-[11px] text-gray-300 placeholder-gray-600 font-mono`}
        />
        {isSecret && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-gray-300">
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
    </div>
  );
}

export function DesignToolsSettings() {
  const { data, mutate } = useDesignTools();
  const { showToast } = useToast();
  const [editingCanva, setEditingCanva] = useState(false);
  const [editingFigma, setEditingFigma] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const dt = (data || {}) as Record<string, Record<string, unknown>>;
  const canva = dt.canva || {};
  const figma = dt.figma || {};
  const canvaConnected = !!canva.clientId;
  const figmaConnected = !!figma.accessToken;
  const canvaEditable = editingCanva || !canvaConnected;
  const figmaEditable = editingFigma || !figmaConnected;

  const saveCanva = async () => {
    const payload = {
      clientId: (document.getElementById("canva-client-id") as HTMLInputElement)?.value?.trim(),
      clientSecret: (document.getElementById("canva-client-secret") as HTMLInputElement)?.value?.trim(),
    };
    if (!payload.clientId) { showToast("Client ID를 입력하세요", "warning"); return; }
    const r = await apiPost<{ ok: boolean }>("/api/design-tools/canva", payload);
    if (r?.ok) { showToast("Canva 설정 저장됨", "success"); setEditingCanva(false); mutate(); }
  };

  const saveFigma = async () => {
    const payload = {
      accessToken: (document.getElementById("figma-token") as HTMLInputElement)?.value?.trim(),
    };
    if (!payload.accessToken) { showToast("Access Token을 입력하세요", "warning"); return; }
    const r = await apiPost<{ ok: boolean }>("/api/design-tools/figma", payload);
    if (r?.ok) { showToast("Figma 설정 저장됨", "success"); setEditingFigma(false); mutate(); }
  };

  const toggleFigmaMcp = async (enabled: boolean) => {
    const r = await apiPost<{ ok: boolean }>("/api/design-tools/figma-mcp", { enabled });
    if (r?.ok) {
      showToast(enabled ? "Figma MCP 활성화 -- gateway 재시작 필요" : "Figma MCP 비활성화", "success");
      mutate();
    }
  };

  const startFigmaOAuth = async () => {
    try {
      const r = await fetcher<{ authUrl?: string; error?: string }>("/api/figma-mcp/start-oauth");
      if (r?.authUrl) {
        window.open(r.authUrl, "_blank");
        showToast("Figma 로그인 페이지가 열렸습니다. Allow 클릭 후 자동 완료됩니다.", "info");
        // Poll for completion
        const poll = setInterval(async () => {
          try {
            const dt2 = await fetcher<Record<string, Record<string, unknown>>>("/api/design-tools");
            if (dt2?.figma?.mcpAccessToken) {
              clearInterval(poll);
              showToast("Figma MCP 연결 완료! Gateway 재시작 필요.", "success");
              mutate();
            }
          } catch { /* keep polling */ }
        }, 3000);
        setTimeout(() => clearInterval(poll), 120000);
      }
    } catch (e) { showToast((e as Error).message, "error"); }
  };

  const restartGateway = async () => {
    setRestarting(true);
    try {
      const r = await apiPost<{ ok: boolean }>("/api/gateway/restart");
      if (r?.ok) showToast("Gateway 재시작 완료. 15초 후 사용 가능.", "success");
    } catch (e) { showToast((e as Error).message, "error"); }
    finally { setRestarting(false); }
  };

  return (
    <>
      <p className="text-[10px] text-gray-500 mb-4">Instagram 카드뉴스를 전문 툴에서 리터치 후 가져오기. 연결하면 Create 탭에서 &quot;편집&quot; 버튼이 활성화됩니다.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Canva */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-[#00C4CC] flex items-center justify-center text-[9px] font-bold text-white">C</span>
              <h3 className="text-sm font-medium text-gray-300">Canva</h3>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded ${canvaConnected ? "bg-green-900/40 text-green-400" : "bg-gray-800 text-gray-500"}`}>
              {canvaConnected ? "Connected" : "Not connected"}
            </span>
          </div>
          <div className="mb-3">
            <ol className="text-[10px] text-gray-400 space-y-1.5 list-decimal list-inside">
              <li><a href="https://www.canva.com/developers/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">canva.com/developers</a> 접속 -- Canva 계정으로 로그인</li>
              <li>좌측 메뉴에서 <strong className="text-gray-300">Your integrations</strong> 클릭</li>
              <li>우측 상단 <strong className="text-gray-300">Create an integration</strong> 버튼 클릭</li>
              <li>이름 입력 -- Type: <strong className="text-gray-300">Private</strong> 선택 -- 약관 체크 -- Create</li>
              <li>Credentials 섹션에서 <strong className="text-gray-300">Client ID</strong> 복사</li>
              <li><strong className="text-gray-300">Generate secret</strong> -- 표시된 값 즉시 복사</li>
              <li>아래 폼에 Client ID + Secret 입력 -- Connect</li>
            </ol>
            <details className="mt-2 text-[10px]">
              <summary className="text-blue-400 hover:text-blue-300 cursor-pointer">더 알아보기</summary>
              <div className="mt-2 p-3 rounded bg-gray-900/50 text-gray-500 space-y-1.5">
                <p>Canva Connect API로 에셋 업로드 -- 템플릿 기반 디자인 생성 -- 편집 -- Export PNG 플로우를 자동화합니다.</p>
                <p className="font-medium text-gray-400 mt-2">Scopes 설정</p>
                <p>앱 설정 페이지 좌측 메뉴 <strong>Scopes</strong> 클릭 -- <strong>Reading and writing</strong> 섹션에서 체크:</p>
                <p className="pl-2"><code className="bg-gray-800 px-1 rounded">design:content</code> Read and Write -- 디자인 생성/수정</p>
                <p className="pl-2"><code className="bg-gray-800 px-1 rounded">design:meta</code> Read -- 디자인 메타데이터</p>
                <p className="pl-2"><code className="bg-gray-800 px-1 rounded">asset</code> Read and Write -- 이미지 업로드</p>
                <p className="pl-2"><code className="bg-gray-800 px-1 rounded">brandtemplate:meta</code> Read -- 템플릿 읽기</p>
                <p className="pl-2"><code className="bg-gray-800 px-1 rounded">brandtemplate:content</code> Read -- 템플릿 내용</p>
                <p className="pl-2"><code className="bg-gray-800 px-1 rounded">profile</code> Read -- 프로필 정보</p>
                <p className="font-medium text-gray-400 mt-2">OAuth Redirect URL (앱 페이지 &gt; Authentication 탭)</p>
                <p>URL 1 필드에 입력: <code className="bg-gray-800 px-1 rounded">{`https://대시보드주소/api/canva/callback`}</code></p>
                <p>Return navigation 스위치 ON -- Return URL도 동일하게 설정</p>
                <p className="font-medium text-gray-400 mt-2">앱 유형</p>
                <p>Private: 내 팀만 사용. Public: Canva 마켓플레이스에 공개 (심사 필요).</p>
              </div>
            </details>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-500">Credentials</span>
            {canvaConnected && !editingCanva && (
              <button onClick={() => setEditingCanva(true)} className="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>
            )}
          </div>
          <div className="space-y-3">
            <CredField id="canva-client-id" label="Client ID" value={String(canva.clientId || "")} editable={canvaEditable} />
            <CredField id="canva-client-secret" label="Client Secret" isSecret value={String(canva.clientSecret || "")} editable={canvaEditable} />
          </div>
          {canvaEditable && (
            <div className="flex gap-2 mt-4">
              <button onClick={saveCanva} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">
                {canvaConnected ? "Update" : "Connect"}
              </button>
              {canvaConnected && editingCanva && (
                <button onClick={() => setEditingCanva(false)} className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">Cancel</button>
              )}
            </div>
          )}
        </div>

        {/* Figma */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-black border border-gray-700 flex items-center justify-center text-[10px] font-bold text-white">F</span>
              <h3 className="text-sm font-medium text-gray-300">Figma</h3>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded ${figmaConnected ? "bg-green-900/40 text-green-400" : "bg-gray-800 text-gray-500"}`}>
              {figmaConnected ? "Connected" : "Not connected"}
            </span>
          </div>
          <div className="mb-3">
            <ol className="text-[10px] text-gray-400 space-y-1.5 list-decimal list-inside">
              <li><a href="https://www.figma.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">figma.com</a> 접속 -- 로그인 -- Settings</li>
              <li><strong className="text-gray-300">Security</strong> 탭 -- <strong className="text-gray-300">Personal access tokens</strong></li>
              <li><strong className="text-gray-300">Generate new token</strong> -- Scopes: <code className="bg-gray-800 px-1 rounded">file_content:read</code>, <code className="bg-gray-800 px-1 rounded">files:read</code></li>
              <li>토큰 <strong className="text-red-400">즉시 복사</strong> -- 아래 폼에 입력 -- Connect</li>
            </ol>
            <details className="mt-3 text-[10px]">
              <summary className="text-blue-400 hover:text-blue-300 cursor-pointer">MCP 서버 연결 (AI가 Figma에 직접 쓰기)</summary>
              <div className="mt-2 p-3 rounded bg-gray-900/50 text-gray-500 space-y-2">
                <p className="text-gray-300 font-medium">MCP란?</p>
                <p>AI Agent가 Figma 캔버스에 직접 프레임/텍스트/이미지를 생성하는 프로토콜. REST API는 읽기만 가능하지만, MCP는 <strong>쓰기</strong>가 됩니다.</p>

                <p className="text-gray-300 font-medium mt-3">Remote MCP 서버 (권장 -- 설치 불필요)</p>
                <p>Figma가 호스팅하는 서버에 연결. 별도 프로그램 설치 없이 URL만 등록하면 됩니다.</p>

                <p className="text-gray-400 font-medium mt-2">연결 방법 -- Claude Code에서:</p>
                <div className="p-2 rounded bg-gray-800 font-mono mt-1 space-y-1">
                  <p className="text-green-400"># 방법 1: 플러그인 (가장 쉬움)</p>
                  <p>claude plugin install figma@claude-plugins-official</p>
                  <p className="text-green-400 mt-2"># 방법 2: 수동 등록</p>
                  <p>claude mcp add --transport http figma https://mcp.figma.com/mcp</p>
                </div>
                <p className="mt-1">실행 후 브라우저에서 Figma 로그인 -- <strong>Allow Access</strong> 클릭</p>

                <p className="text-gray-400 font-medium mt-2">VS Code에서:</p>
                <p>Cmd+Shift+P -- &quot;MCP: Open User Configuration&quot; -- 아래 JSON 추가:</p>
                <div className="p-2 rounded bg-gray-800 font-mono mt-1">
                  <p>{`"figma": { "url": "https://mcp.figma.com/mcp", "type": "http" }`}</p>
                </div>

                <p className="text-gray-400 font-medium mt-2">OpenClaw Gateway에서:</p>
                <p>config/openclaw.json에 MCP 서버 등록 (지원되는 경우):</p>
                <div className="p-2 rounded bg-gray-800 font-mono mt-1">
                  <p>{`"mcp": { "figma": { "url": "https://mcp.figma.com/mcp" } }`}</p>
                </div>

                <p className="text-gray-300 font-medium mt-3">MCP로 할 수 있는 것</p>
                <p>프레임/텍스트/이미지 생성 및 수정</p>
                <p>컴포넌트, 변수, Auto Layout 활용</p>
                <p>디자인 시스템을 기반으로 일관된 디자인</p>
                <p>현재 Beta 무료 (이후 사용량 기반 유료)</p>

                <p className="text-gray-300 font-medium mt-3">REST API vs MCP 차이</p>
                <div className="mt-1 space-y-0.5">
                  <p><strong>REST API</strong> (위에서 입력한 토큰): 파일 읽기 + PNG Export만 가능. 쓰기 불가.</p>
                  <p><strong>MCP 서버</strong>: 읽기 + <strong>쓰기</strong>. AI가 직접 캔버스에 디자인 생성/수정.</p>
                  <p>-- 둘 다 필요: MCP로 생성, REST API로 Export</p>
                </div>

                <p className="text-gray-300 font-medium mt-3">자동화 흐름</p>
                <p>1. 카드뉴스 텍스트 입력 (대시보드)</p>
                <p>2. AI Agent가 MCP로 Figma에 슬라이드 프레임 자동 생성</p>
                <p>3. 디자이너가 Figma에서 리터치</p>
                <p>4. REST API로 PNG Export -- R2 업로드 -- 큐 저장</p>
                <p>5. Instagram 캐러셀 발행</p>
              </div>
            </details>
            <details className="mt-2 text-[10px]">
              <summary className="text-blue-400 hover:text-blue-300 cursor-pointer">더 알아보기</summary>
              <div className="mt-2 p-3 rounded bg-gray-900/50 text-gray-500 space-y-1.5">
                <p className="font-medium text-gray-400">Personal Access Token 주의</p>
                <p>토큰 하나로 Figma 계정의 <strong>모든 파일</strong>에 접근 가능. 신뢰할 수 있는 환경에서만 사용. 통합당 토큰 1개 생성 권장.</p>
                <p className="font-medium text-gray-400 mt-2">Scopes (권한) 상세</p>
                <p><code className="bg-gray-800 px-1 rounded">file_content:read</code> -- 파일 노드/레이어 읽기, PNG Export에 필수</p>
                <p><code className="bg-gray-800 px-1 rounded">files:read</code> -- 파일 목록 접근</p>
                <p><code className="bg-gray-800 px-1 rounded">file_dev_resources:write</code> -- 개발 리소스 쓰기 (선택)</p>
                <p className="font-medium text-gray-400 mt-2">지원 MCP 클라이언트</p>
                <p>Claude Code, VS Code (Copilot), Cursor, Codex -- <a href="https://developers.figma.com/docs/figma-mcp-server/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">전체 목록</a></p>
              </div>
            </details>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-500">Credentials</span>
            {figmaConnected && !editingFigma && (
              <button onClick={() => setEditingFigma(true)} className="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>
            )}
          </div>
          <div className="space-y-3">
            <CredField id="figma-token" label="Personal Access Token" isSecret value={String(figma.accessToken || "")} editable={figmaEditable} />
          </div>
          {figmaEditable && (
            <div className="flex gap-2 mt-4">
              <button onClick={saveFigma} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">
                {figmaConnected ? "Update" : "Connect"}
              </button>
              {figmaConnected && editingFigma && (
                <button onClick={() => setEditingFigma(false)} className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">Cancel</button>
              )}
            </div>
          )}

          {figmaConnected && (
            <div className="mt-4 pt-4 border-t border-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-300">MCP 서버 (AI -- Figma 쓰기)</p>
                  <p className="text-[10px] text-gray-600">AI가 Figma에 카드뉴스 프레임을 자동 생성</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!figma.mcpEnabled}
                    onChange={(e) => toggleFigmaMcp(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              {!!figma.mcpEnabled && !figma.mcpAccessToken && (
                <div className="p-3 rounded bg-yellow-900/10 border border-yellow-800/30 space-y-3 text-[10px]">
                  <p className="text-yellow-400 font-medium">MCP 연결 필요</p>
                  <p className="text-gray-500">Figma 계정으로 로그인하여 MCP 접근을 허용합니다.</p>
                  <button onClick={startFigmaOAuth} className="w-full py-2.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-500 font-medium">
                    Figma 계정으로 MCP 연결
                  </button>
                  <p className="text-gray-600">클릭하면 Figma 로그인 페이지가 새 탭으로 열립니다.</p>
                </div>
              )}
              {!!figma.mcpEnabled && !!figma.mcpAccessToken && (
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-green-400">MCP 연결됨</p>
                  <button
                    onClick={restartGateway}
                    disabled={restarting}
                    className="px-3 py-1 text-[10px] bg-yellow-700 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                  >
                    {restarting ? "재시작 중..." : "Gateway 재시작"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
