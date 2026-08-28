import playwright from "/Users/sj/kimstudy-auto/node_modules/playwright-core/index.js";
const exe="/Users/sj/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const W="cd1d0a40-540d-4524-9b49-bf2445d82182";
const b=await playwright.chromium.launch({executablePath:exe,headless:true});
const ctx=await b.newContext({viewport:{width:1440,height:1200}});
await ctx.addInitScript(({t,st,w})=>{
  localStorage.setItem("dashboard_auth_token",t);
  localStorage.setItem("active_workspace",JSON.stringify({id:w,slug:"local",name:"로컬 검증 작업 공간",tier:"team"}));
  localStorage.setItem("studio_work",JSON.stringify({
    idea:"1인 사업가의 콘텐츠 운영 시간 줄이기",
    text:{threads:"기준 셋",x:"반복부터 줄입니다.",facebook:"한 흐름으로 묶습니다.",
      instagram:{caption:"한 번 만들고 일곱 채널",hashtags:["OSMU"],slides:["1","2","3"]},
      shorts:{hook:"매일 발행해도 시간이 남는 이유",body:"반복을 줄입니다.",cta:"오늘 한 편부터."}},
    includes:{threads:true,x:true,facebook:false,instagram:true,shorts:false,reels:false,tiktok:false},
    editLines:["첫 장면에서 문제를 짚습니다.","둘째 장면에서 해결 순서를 보여 줍니다.","마지막 장면에서 할 일을 말합니다."],
    createBranch:"video", editKind:"video"}));
  sessionStorage.setItem("studio_generation_token",st);
  sessionStorage.setItem("studio_skill_version_id","22222222-2222-4222-8222-222222222222");
  sessionStorage.setItem("studio_workspace_id",w);
},{t:process.env.DASHBOARD_AUTH_TOKEN,st:process.env.STUDIO_DEV_BEARER_TOKEN,w:W});
const p=await ctx.newPage();
await p.route("**/api/me",r=>r.fulfill({status:200,contentType:"application/json",
  body:JSON.stringify({isOperator:false,tenant:{id:W,slug:"local",name:"로컬 검증 작업 공간",status:"active"}})}));
const rows=[];
for (const [room,url] of [["create","/studio?room=create"],["edit","/studio?room=edit"],["publish","/studio?room=publish"],["perf","/"]]) {
  await p.goto(`http://localhost:3456${url}`,{waitUntil:"networkidle"});
  await p.waitForTimeout(1000);
  rows.push(await p.evaluate((r)=>({
    방:r,
    그려짐:document.querySelector(`[data-room="${r}"]`)!==null,
    방머리:document.querySelector(`[data-room-top="${r}"]`)!==null,
    목차항목:document.querySelectorAll("[data-edit-outline] li").length,
    대사줄:document.querySelectorAll("[data-edit-script] input, [data-edit-script] li").length,
    미리보기:document.querySelectorAll("[data-pv-platform], [aria-label*='미리보기']").length,
    성과실:document.querySelector("[data-room='performance'], [data-room='perf']")!==null,
    가린모달:document.querySelectorAll(".fixed.inset-0.z-50").length,
    단추:document.querySelectorAll("main button").length,
  }),room));
}
console.table(rows);
await b.close();
