const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const details = read('raw/model-details-all.json');
const jobs = read('raw/job-details.json');
const controlled = read('raw/controlled-job-details.json');
const mediaMeta = read('raw/media-metadata.json');

const utilityKinds = {
  bytedance_image_upscale: 'upscaler', flux_2_pro_outpaint: 'generative_edit_utility',
  image_background_remover: 'background_removal', outpaint: 'generative_edit_utility',
  topaz_image: 'upscaler_restoration', topaz_image_generative: 'generative_upscaler',
  nano_banana_2_ai_stylist: 'styling_utility', nano_banana_2_relight: 'relighting_utility',
  nano_banana_2_skin_enhancer: 'retouch_utility', nano_banana_2_shots: 'shot_expansion_utility',
  bytedance_video_upscale: 'upscaler', clipify: 'youtube_clipping_utility',
  llm_text: 'text_utility_misclassified_as_video', sam_3_video: 'background_removal',
  topaz_video: 'upscaler_restoration', video_background_remover: 'background_removal',
  video_deflicker: 'deflicker_utility', video_upscale: 'upscaler'
};

const generativeEdit = new Set(['flux_kontext', 'kling_omni_image', 'image_auto', 'openai_hazel']);
const costFiles = fs.readdirSync(path.join(root, 'logs')).filter(f => /^cost-.*\.json$/.test(f));
const costs = {};
for (const file of costFiles) {
  const key = file.replace(/^cost-/, '').replace(/-retry2?/, '').replace(/\.json$/, '');
  const raw = fs.readFileSync(path.join(root, 'logs', file), 'utf8').trim();
  const match = raw.match(/"credits"\s*:\s*([0-9.]+)/);
  if (match) costs[key] = Number(match[1]);
}

const models = details.map(m => {
  const utility = utilityKinds[m.job_type];
  const capability = utility ? 'utility' : (generativeEdit.has(m.job_type) ? 'generative_editor' : 'generative_model');
  const modes = [];
  const names = new Set(m.params.map(p => p.name));
  if (names.has('prompt')) modes.push(m.type === 'image' ? 'text_to_image' : 'text_to_video');
  if (names.has('start_image')) modes.push('image_to_video');
  if (names.has('end_image')) modes.push('first_last_frame');
  if (names.has('image_references')) modes.push(m.type === 'image' ? 'reference_image_generation_or_edit' : 'reference_to_video');
  if (names.has('video_references')) modes.push('video_reference_or_edit');
  if (names.has('audio_references')) modes.push('audio_conditioned');
  return {
    ...m,
    inventory_as_of: '2026-08-14T03:39:00+09:00',
    capability_class: capability,
    utility_kind: utility || null,
    supported_modes_inferred_from_cli_params: modes,
    quoted_default_credits_observed: costs[m.job_type] ?? null,
    quote_note: costs[m.job_type] != null ? 'CLI preflight quote using safe controlled prompt; no job submitted' : 'Not quoted because media input or special preset was required',
    source: `higgsfield model get ${m.job_type} --json`
  };
}).sort((a, b) => a.type.localeCompare(b.type) || a.job_type.localeCompare(b.job_type));

const legacyObserved = [{
  display_name: 'Cinematic Studio 3.0', job_type: 'cinematic_studio_3_0', type: 'video',
  capability_class: 'legacy_or_workflow_model', utility_kind: null,
  inventory_as_of: '2026-08-14T03:39:00+09:00',
  note: 'Observed in completed job history and transactions, but absent from current `higgsfield model list` output.',
  source: 'higgsfield generate list --size 100 --json'
}];

const modelsPayload = {
  stamp: {
    line: '00-model-matrix', generated_at: '2026-08-14T04:02:00+09:00',
    model: 'gpt-5.6-sol', agent: 'higgsfield_model_matrix', skills: [],
    evidence: ['Higgsfield CLI model list/get/cost', 'https://higgsfield.ai/'],
    deliberation: 'Separated prompt-driven generation from transformation utilities so credits are not wasted comparing incomparable tools.'
  },
  summary: {
    current_image_video_entries: models.length,
    image_entries: models.filter(m => m.type === 'image').length,
    video_entries: models.filter(m => m.type === 'video').length,
    actual_generative_or_generative_edit: models.filter(m => m.capability_class !== 'utility').length,
    utilities: models.filter(m => m.capability_class === 'utility').length,
    legacy_observed_not_currently_listed: legacyObserved.length
  },
  models,
  legacy_observed: legacyObserved
};
fs.writeFileSync(path.join(root, 'models.json'), JSON.stringify(modelsPayload, null, 2) + '\n');

const csvHeaders = [
  'timestamp','experiment_id','source','category','hypothesis','controlled_prompt_id','full_prompt','model','all_params_json',
  'pre_cost','actual_charge','balance_before','balance_after','job_id','status','failure_class','failure_reason','render_seconds',
  'result_url','local_file','dimensions','duration_seconds','rights','ai_disclosure','human_evaluation','verdict','next_variable'
];
const rows = [];
const push = (r) => rows.push(Object.fromEntries(csvHeaders.map(h => [h, r[h] ?? ''])));

const metaById = Object.fromEntries(mediaMeta.map(m => [path.basename(m.file, '.mp4'), m]));
const promptId = (prompt) => {
  if (prompt.startsWith('Vertical framing. A wall calendar')) return 'CTRL-VIDEO-CALENDAR-V1';
  if (prompt.startsWith('Vertical framing. Overhead shot')) return 'CTRL-VIDEO-PAPER-V1';
  if (prompt.startsWith('Vertical framing. Close insert')) return 'CTRL-VIDEO-BUTTON-V1';
  if (prompt.includes('creator-style video')) return 'CTRL-PERSONA-STUDIO-V1';
  return 'ARCHIVE-SAFE-V1';
};
const category = (prompt) => prompt.includes('wall calendar') || prompt.includes('paper') ? 'product_text_free_scene' : prompt.includes('creator-style') ? 'portrait' : 'action_or_object_motion';
const chargeByModel = {
  kling3_0: 12, kling3_0_turbo: 7.5, wan2_7: 7.5, seedance1_5: 4.8,
  seedance_2_0: 22.5, veo3_1_lite: 8, seedance_2_5: 32.5, kling2_6: 10,
  cinematic_studio_3_0: 25, wan2_6: 13, happy_horse_video: 12.5,
  wan3_0: 12.5, minimax_h3: 24, gemini_omni: 24
};
const chargeByJob = {
  'f1315fce-6487-45ba-a064-2081a8b0ccaf': 60,
  '1782b6d7-45df-49e2-9009-e4d35d8d9590': 8.75,
  '6ec905ad-f7bd-4e57-a468-c75d15d26547': 8.75,
  '5297b803-2823-44cd-a74a-750e25f893e6': 8.75,
  '0524d1fb-3077-4069-8119-34fda19d8a95': 8.75
};

const mergedJobs = new Map([...jobs, ...controlled].map(j => [j.id, j]));
for (const j of mergedJobs.values()) {
  const prompt = j.params?.prompt || '';
  const meta = metaById[j.id];
  push({
    timestamp: j.created_at, experiment_id: `OBS-${j.id.slice(0,8)}`, source: 'shared_account_completed_job_recovered_by_this_line',
    category: category(prompt), hypothesis: 'Same prompt and fixed output framing expose differences in motion coherence, prompt adherence, and artifact rate.',
    controlled_prompt_id: promptId(prompt), full_prompt: prompt, model: j.job_type, all_params_json: JSON.stringify(j.params || {}),
    pre_cost: chargeByJob[j.id] ?? chargeByModel[j.job_type] ?? '', actual_charge: chargeByJob[j.id] ?? chargeByModel[j.job_type] ?? '',
    balance_before: '', balance_after: '', job_id: j.id, status: j.status, failure_class: '', failure_reason: '',
    render_seconds: 'not_exposed_by_CLI', result_url: j.result_url || '', local_file: `media/${j.id}.mp4`,
    dimensions: meta ? `${meta.width}x${meta.height}` : `${j.params?.width || ''}x${j.params?.height || ''}`,
    duration_seconds: meta?.duration ?? j.params?.duration ?? '', rights: 'fictional_or_generic; no real likeness; no logos',
    ai_disclosure: 'required_on_publish', human_evaluation: 'PENDING: prompt_adherence __/5; motion __/5; anatomy_or_geometry __/5; artifacts __/5; reuse_value __/5',
    verdict: 'AWAITING_HUMAN_REVIEW', next_variable: 'Hold prompt fixed; compare one model or one parameter only.'
  });
}

const imagePrompt = 'A rights-clean studio photograph of a fictional adult ceramic designer beside an unbranded cobalt vase, original face, no resemblance to any real person, no readable text, no logos, photorealistic natural light.';
const videoPrompt = 'Vertical 9:16, exactly five seconds. A completely fictional adult courier in a plain cobalt jacket runs through a rain-lit invented market, jumps over one shallow puddle, lands safely, and keeps running. Original face, no resemblance to any real person. One continuous side-tracking shot, physically credible anatomy, no logos, no brands, no readable text, no watermark, no dialogue, silent visual only.';
for (const [model, quote] of Object.entries(costs)) {
  const isVideo = models.find(m => m.job_type === model)?.type === 'video';
  push({
    timestamp: '2026-08-14T03:41:00+09:00', experiment_id: `QUOTE-${model}`, source: 'this_line_cli_preflight',
    category: isVideo ? 'action' : 'portrait_product', hypothesis: 'Default-parameter price establishes the cost denominator before controlled quality testing.',
    controlled_prompt_id: isVideo ? 'CTRL-ACTION-COURIER-V1' : 'CTRL-IMAGE-PORTRAIT-PRODUCT-V1', full_prompt: isVideo ? videoPrompt : imagePrompt,
    model, all_params_json: JSON.stringify({prompt: isVideo ? videoPrompt : imagePrompt, defaults: true}), pre_cost: quote, actual_charge: 0,
    balance_before: 0, balance_after: 0, job_id: '', status: 'PREFLIGHT_COST_OK_NO_SUBMISSION', failure_class: 'balance_guard',
    failure_reason: 'Active workspace reported 0 credits. New submissions prohibited at or below 50-credit safety floor.', render_seconds: 0,
    result_url: '', local_file: `logs/cost-${model}.json`, dimensions: '', duration_seconds: '', rights: 'safe fictional prompt', ai_disclosure: 'required_on_publish',
    human_evaluation: 'NOT_APPLICABLE_NO_RENDER', verdict: 'BLOCKED_BALANCE', next_variable: 'Run one controlled render only after credits exceed safety floor.'
  });
}

const validationFailures = [
  ['soul_cast','image','Missing required params: aspect_ratio','logs/cost-soul_cast.json'],
  ['minimax_hailuo','video','start_image or end_image required under CLI default validation; retry also exposed resolution type parsing mismatch','logs/cost-minimax_hailuo.json'],
  ['wan3_0','video','CLI default-duration validation bug: unsupported validation rule; explicit duration retry succeeded','logs/cost-wan3_0.json'],
  ['veo3','video','Missing required params: start_image','logs/cost-veo3.json']
];
for (const [model, type, reason, file] of validationFailures) push({
  timestamp: '2026-08-14T03:42:00+09:00', experiment_id: `FAIL-${model}`, source: 'this_line_cli_preflight', category: type,
  hypothesis: 'CLI defaults should satisfy the model schema.', controlled_prompt_id: type === 'video' ? 'CTRL-ACTION-COURIER-V1' : 'CTRL-IMAGE-PORTRAIT-PRODUCT-V1',
  full_prompt: type === 'video' ? videoPrompt : imagePrompt, model, all_params_json: JSON.stringify({prompt: type === 'video' ? videoPrompt : imagePrompt}),
  pre_cost: '', actual_charge: 0, balance_before: 0, balance_after: 0, job_id: '', status: 'PREFLIGHT_VALIDATION_FAILED',
  failure_class: 'cli_schema_or_required_media', failure_reason: reason, render_seconds: 0, result_url: '', local_file: file,
  rights: 'safe fictional prompt', ai_disclosure: 'required_on_publish', human_evaluation: 'NOT_APPLICABLE_NO_RENDER', verdict: 'FAILURE_PRESERVED',
  next_variable: 'Supply explicit required parameters or reference media; do not treat CLI defaults as authoritative.'
});

push({
  timestamp: '2026-08-14T03:40:00+09:00', experiment_id: 'BLOCK-ACCOUNT-000', source: 'this_line_account_guard', category: 'account',
  hypothesis: '100-130 credits can be spent without crossing the shared 50-credit floor.', controlled_prompt_id: 'ALL', full_prompt: '', model: 'ALL', all_params_json: '{}',
  pre_cost: 100, actual_charge: 0, balance_before: 266.92, balance_after: 0, job_id: '', status: 'BLOCKED_BALANCE', failure_class: 'shared_account_depleted',
  failure_reason: 'Workspace changed from plus/266.92 credits to free/0. Transactions show a Subscription Cancelled deduction of 194.62 after concurrent spending. No new job was submitted by this line.',
  render_seconds: 0, result_url: '', local_file: 'raw/transactions.json', rights: 'not_applicable', ai_disclosure: 'not_applicable',
  human_evaluation: 'NOT_APPLICABLE', verdict: 'STOP_NEW_JOBS', next_variable: 'Restore credits or select a funded workspace, then resume under the 50-credit guard.'
});

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const csv = [csvHeaders.map(esc).join(','), ...rows.map(r => csvHeaders.map(h => esc(r[h])).join(','))].join('\n') + '\n';
fs.writeFileSync(path.join(root, 'experiments.csv'), csv);

const galleryJobs = [...mergedJobs.values()].filter(j => fs.existsSync(path.join(root, 'media', `${j.id}.mp4`)));
const galleryData = galleryJobs.map(j => ({
  id: j.id, model: j.job_type, status: j.status, created_at: j.created_at, prompt: j.params?.prompt || '', params: j.params || {},
  result_url: j.result_url, local_video: `media/${j.id}.mp4`, poster: `media/${j.id}.jpg`,
  prompt_id: promptId(j.params?.prompt || ''), category: category(j.params?.prompt || ''),
  actual_charge: chargeByJob[j.id] ?? chargeByModel[j.job_type] ?? null,
  review: 'PENDING: fidelity __/5 · motion __/5 · geometry __/5 · artifacts __/5 · reuse __/5'
}));

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Higgsfield Model Matrix</title><style>
:root{color-scheme:dark;--bg:#08090b;--panel:#121419;--line:#2b3039;--ink:#f3f5f7;--muted:#9da6b2;--lime:#b9ff66;--red:#ff796e}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 Inter,system-ui,sans-serif}header{position:sticky;top:0;z-index:4;background:rgba(8,9,11,.94);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);padding:18px 24px}.top{display:flex;align-items:end;justify-content:space-between;gap:16px;flex-wrap:wrap}h1{font-size:clamp(24px,4vw,48px);line-height:1;margin:0;letter-spacing:-.04em}p{margin:5px 0;color:var(--muted)}.stats{display:flex;gap:8px;flex-wrap:wrap}.pill,button,select{border:1px solid var(--line);background:#171a20;color:var(--ink);border-radius:999px;padding:8px 12px}.alert{color:#15180f;background:var(--lime);border-color:var(--lime);font-weight:800}.controls{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}button{cursor:pointer}main{padding:20px 24px 80px;max-width:1800px;margin:auto}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;overflow:hidden}.card video{display:block;width:100%;aspect-ratio:9/16;object-fit:cover;background:#000}.body{padding:12px}.model{display:flex;justify-content:space-between;gap:10px;font-weight:800}.tag{color:var(--lime);font-size:11px}.prompt{max-height:90px;overflow:auto;color:#c7cdd4;font-size:12px;margin:10px 0}.meta{font-size:11px;color:var(--muted);word-break:break-all}.review{margin-top:10px;border-top:1px solid var(--line);padding-top:9px;color:#ffd98a;font-size:11px}.empty{padding:80px;text-align:center;color:var(--muted)}.stamp{position:fixed;bottom:8px;right:8px;background:#101216e8;border:1px solid var(--line);padding:8px 10px;border-radius:9px;font-size:10px;color:var(--muted);max-width:420px}body.compact .grid{grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}body.compact .prompt,body.compact .review{display:none}@media(max-width:560px){header,main{padding-left:12px;padding-right:12px}.grid{grid-template-columns:1fr;gap:10px}body.compact .grid{grid-template-columns:1fr 1fr}.body{padding:11px}.card video{aspect-ratio:9/16}.stamp{position:static;margin:12px}}
</style></head><body><header><div class="top"><div><h1>Higgsfield Model Matrix</h1><p>통제 프롬프트, 모델별 실제 렌더, 실패까지 한 화면에서 비교</p></div><div class="stats"><span class="pill">현재 CLI 58개</span><span class="pill">생성/편집 40개</span><span class="pill">유틸리티 18개</span><span class="pill alert">잔액 0 · 신규 생성 중지</span></div></div><div class="controls"><select id="promptFilter"><option value="all">모든 통제군</option></select><select id="modelFilter"><option value="all">모든 모델</option></select><button id="layout">조밀하게</button><button id="mute">전체 음소거 유지</button><span class="pill" id="count"></span></div></header><main><div id="grid" class="grid"></div></main><div class="stamp">🏷 STAMP | line: 00-model-matrix | 생성: 2026-08-14 04:02 KST | model: gpt-5.6-sol | agent: higgsfield_model_matrix<br>근거: Higgsfield CLI model list/get/cost/generate get · https://higgsfield.ai/<br>고민: 생성 모델과 업스케일·제거 유틸을 분리하고, 잔액 0에서 신규 과금을 즉시 중단</div><script>
const DATA=${JSON.stringify(galleryData)};
const grid=document.querySelector('#grid'),pf=document.querySelector('#promptFilter'),mf=document.querySelector('#modelFilter'),count=document.querySelector('#count');
const uniq=(k)=>[...new Set(DATA.map(x=>x[k]))].sort(); uniq('prompt_id').forEach(x=>pf.insertAdjacentHTML('beforeend','<option value="'+x+'">'+x+'</option>'));uniq('model').forEach(x=>mf.insertAdjacentHTML('beforeend','<option value="'+x+'">'+x+'</option>'));
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function render(){const rows=DATA.filter(x=>(pf.value==='all'||x.prompt_id===pf.value)&&(mf.value==='all'||x.model===mf.value));count.textContent=rows.length+' renders';grid.innerHTML=rows.length?rows.map(x=>'<article class="card"><video controls muted playsinline preload="metadata" poster="'+x.poster+'"><source src="'+x.local_video+'" type="video/mp4"></video><div class="body"><div class="model"><span>'+safe(x.model)+'</span><span class="tag">'+safe(x.prompt_id)+'</span></div><div class="prompt">'+safe(x.prompt)+'</div><div class="meta">job '+x.id+'<br>'+safe(JSON.stringify(x.params))+'<br>charge '+(x.actual_charge??'unresolved')+' cr</div><div class="review">'+x.review+'</div></div></article>').join(''):'<div class="empty">해당 조합의 렌더가 없습니다.</div>';}pf.onchange=mf.onchange=render;document.querySelector('#layout').onclick=e=>{document.body.classList.toggle('compact');e.target.textContent=document.body.classList.contains('compact')?'크게 보기':'조밀하게'};document.querySelector('#mute').onclick=()=>document.querySelectorAll('video').forEach(v=>v.muted=true);render();
</script></body></html>`;
fs.writeFileSync(path.join(root, 'index.html'), html);

console.log(JSON.stringify({models: modelsPayload.summary, experiment_rows: rows.length, gallery_items: galleryData.length}, null, 2));
