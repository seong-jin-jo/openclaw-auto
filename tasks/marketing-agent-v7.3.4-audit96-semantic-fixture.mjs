import fs from 'node:fs';
import crypto from 'node:crypto';

const root = '/Users/sj/sj_code_master/openclaw-auto';
const auditPath = `${root}/tasks/marketing-agent-v18-completeness-audit.output`;
const prdPath = `${root}/docs/openclaw-auto-marketing-agent-prd-v7.3.4-gpt-codex.md`;
const manifestPath = `${root}/tasks/marketing-agent-prd-v7.3.4-audit96-source-manifest.output`;
const args = new Set(process.argv.slice(2));
const write = args.has('--write');
const mutate = [...args].find(x => x.startsWith('--mutate='))?.slice(9) ?? null;

const audit = fs.readFileSync(auditPath, 'utf8');
const prd = fs.readFileSync(prdPath, 'utf8');
const split = line => line.split('|').slice(1, -1).map(x => x.trim());

const source = new Map();
for (const line of audit.split('\n')) {
  if (!/^\| [A-H]\d{2}\b/.test(line)) continue;
  const c = split(line);
  const id = c[0].match(/^([A-H]\d{2})/)[1];
  source.set(id, { contract: c[1], action: c[4], failure: c[5] });
}

const rtm = new Map();
for (const line of prd.split('\n')) {
  if (!/^\| [A-H]\d{2} \|/.test(line)) continue;
  const c = split(line);
  rtm.set(c[0], { mapping: c[1], summary: c[2], evidence: c[3], release: c[4] });
}

const independent = new Map();
for (const catalogPath of [
  `${root}/tasks/audit96-abc-exact-assertions.output`,
  `${root}/tasks/audit96-de-exact-assertions.output`,
  `${root}/tasks/audit96-fgh-exact-assertions.output`
]) {
  if (!fs.existsSync(catalogPath)) continue;
  for (const line of fs.readFileSync(catalogPath, 'utf8').split('\n')) {
    if (!/^(?:\| )?[A-H]\d{2} \|/.test(line)) continue;
    const c = line.startsWith('|') ? split(line) : line.split('|').map(x => x.trim());
    independent.set(c[0], {
      happy: c[1].replace(/^H:/, ''),
      edge: c[2].replace(/^E:/, ''),
      failure: c[3].replace(/^F:/, ''),
      catalogPath
    });
  }
}

const ids = [...source.keys()].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
const rows = ids.map(id => {
  const s = source.get(id);
  const m = rtm.get(id) ?? {};
  const review = independent.get(id);
  return {
    id,
    source: s,
    mapping: m.mapping ?? '',
    release: m.release ?? '',
    independent_catalog: review?.catalogPath ?? '',
    happy: `QA-AUD-${id}-H: Source contract exact “${s.contract}” and source action exact “${s.action}”. Independent observable assertion: ${review?.happy ?? 'MISSING INDEPENDENT H ASSERTION'}`,
    edge: `QA-AUD-${id}-E: Source action exact “${s.action}” and source evidence exact “${s.failure}”. Independent edge assertion: ${review?.edge ?? 'MISSING INDEPENDENT E ASSERTION'}`,
    failure: `QA-AUD-${id}-F: Source failure exact “${s.failure}”. Independent forbidden/failure assertion: ${review?.failure ?? 'MISSING INDEPENDENT F ASSERTION'} If one required predicate is absent, changed or contradicted, QA-AUD-${id}, ${m.release ?? 'MISSING_RELEASE'} and the Audit96 aggregate all FAIL. Numeric 96, hash equality, route reachability and prior-critic silence contribute PASS0.`
  };
});

if (mutate) {
  const [id, field] = mutate.split(':');
  const row = rows.find(x => x.id === id);
  if (!row) throw new Error(`unknown mutation row ${id}`);
  if (field === 'happy-action') row.happy = row.happy.replace(row.source.action, '[REMOVED_ACTION_PREDICATE]');
  else if (field === 'edge-failure') row.edge = row.edge.replace(row.source.failure, '[REMOVED_FAILURE_PREDICATE]');
  else if (field === 'mapping') row.mapping = '';
  else throw new Error(`unknown mutation field ${field}`);
}

const failures = [];
for (const row of rows) {
  const checks = {
    source_contract_in_happy: row.happy.includes(row.source.contract),
    source_action_in_happy: row.happy.includes(row.source.action),
    source_action_in_edge: row.edge.includes(row.source.action),
    source_failure_in_edge: row.edge.includes(row.source.failure),
    source_failure_in_failure: row.failure.includes(row.source.failure),
    unique_qa_ids: row.happy.includes(`QA-AUD-${row.id}-H`) && row.edge.includes(`QA-AUD-${row.id}-E`) && row.failure.includes(`QA-AUD-${row.id}-F`),
    exact_mapping_present: row.mapping.includes('→AC') && row.mapping.includes('→TC') && row.mapping.includes(`QA-AUD-${row.id}-H/E/F`),
    release_present: row.release === `RC-AUD-${row.id}`,
    independent_catalog_present: Boolean(row.independent_catalog),
    mutation_teeth_declared: row.failure.includes(`${row.release} and the Audit96 aggregate all FAIL`)
  };
  const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
  if (missing.length) failures.push({ id: row.id, missing });
}

const summary = {
  artifact: 'marketing-agent-v7.3.4-audit96-semantic-fixture',
  source_sha256: crypto.createHash('sha256').update(audit).digest('hex'),
  source_rows: rows.length,
  mapped_rows: rows.filter(x => x.mapping).length,
  assertion_rows: rows.length,
  assertions: rows.length * 3,
  independent_catalog_rows: rows.filter(x => x.independent_catalog).length,
  mutation: mutate,
  row_failures: failures,
  failed_rows: failures.length,
  aggregate: failures.length === 0 ? 'PASS' : 'FAIL',
  self_certification_boundary: 'This validator proves exact source-predicate retention and mutation teeth only. Independent plan-critic still owns semantic acceptance.'
};

if (write) {
  const esc = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
  const out = [];
  out.push('# Audit96 exact source → happy/edge/failure TC manifest — PRD v7.3.4');
  out.push('');
  out.push(`SOURCE_AUDIT: ${auditPath}`);
  out.push(`SOURCE_SHA256: ${summary.source_sha256}`);
  out.push(`PRD: ${prdPath}`);
  out.push(`SOURCE_ROWS: ${summary.source_rows}`);
  out.push(`ASSERTIONS: ${summary.assertions}`);
  out.push('SEMANTIC_POLICY: row/hash/count/prior-critic silence cannot certify meaning. Each row below pins the exact source contract, required action/state and failure evidence into three uniquely addressed QA TC assertions. Independent critic remains the semantic gate.');
  out.push('');
  out.push('| Audit | Exact source contract | Exact required action/state | Exact source failure evidence | Mapped FR→AC→TC + QA TC | Happy assertion | Edge assertion | Failure assertion | Release |');
  out.push('|---|---|---|---|---|---|---|---|---|');
  for (const row of rows) {
    out.push(`| ${row.id} | ${esc(row.source.contract)} | ${esc(row.source.action)} | ${esc(row.source.failure)} | ${esc(row.mapping)} | ${esc(row.happy)} | ${esc(row.edge)} | ${esc(row.failure)} | ${row.release} |`);
  }
  out.push('');
  out.push('MUTATION_FIXTURE: `node tasks/marketing-agent-v7.3.4-audit96-semantic-fixture.mjs --mutate=B10:happy-action` must exit nonzero with B10 and aggregate FAIL.');
  out.push('SELF_CERTIFICATION: 0 — validator PASS is structural/executable evidence, not independent semantic approval.');
  fs.writeFileSync(manifestPath, `${out.join('\n')}\n`);
}

console.log(JSON.stringify(summary, null, 2));
process.exit(failures.length === 0 ? 0 : 1);
