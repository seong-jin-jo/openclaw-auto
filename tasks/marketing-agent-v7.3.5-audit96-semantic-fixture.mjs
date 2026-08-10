import fs from 'node:fs';
import crypto from 'node:crypto';

const root = '/Users/sj/sj_code_master/openclaw-auto';
const auditPath = root + '/tasks/marketing-agent-v18-completeness-audit.output';
const prdPath = root + '/docs/openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md';
const canonicalManifestPath = root + '/tasks/marketing-agent-prd-v7.3.5-audit96-source-manifest.output';
const args = process.argv.slice(2);
const emit = args.includes('--emit');
const manifestArg = args.find(x => x.startsWith('--manifest='));
const jsonArg = args.find(x => x.startsWith('--json='));
const manifestPath = manifestArg ? manifestArg.slice('--manifest='.length) : canonicalManifestPath;
const jsonPath = jsonArg ? jsonArg.slice('--json='.length) : null;

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const audit = fs.readFileSync(auditPath, 'utf8');
const prd = fs.readFileSync(prdPath, 'utf8');

function splitMarkdown(line) {
  const cells = [];
  let cell = '';
  const body = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  for (let i = 0; i < body.length; i += 1) {
    if (body[i] === '\\' && body[i + 1] === '|') {
      cell += '|';
      i += 1;
    } else if (body[i] === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += body[i];
    }
  }
  cells.push(cell.trim());
  return cells;
}

const source = new Map();
for (const line of audit.split('\n')) {
  if (!/^\| [A-H]\d{2}\b/.test(line)) continue;
  const c = splitMarkdown(line);
  const id = c[0].match(/^([A-H]\d{2})/)[1];
  source.set(id, { contract: c[1], action: c[4], failure: c[5] });
}

const rtm = new Map();
for (const line of prd.split('\n')) {
  if (!/^\| [A-H]\d{2} \|/.test(line)) continue;
  const c = splitMarkdown(line);
  rtm.set(c[0], { mapping: c[1], summary: c[2], evidence: c[3], release: c[4] });
}

const independent = new Map();
for (const catalogPath of [
  root + '/tasks/audit96-abc-exact-assertions.output',
  root + '/tasks/audit96-de-exact-assertions.output',
  root + '/tasks/audit96-fgh-exact-assertions.output'
]) {
  for (const line of fs.readFileSync(catalogPath, 'utf8').split('\n')) {
    if (!/^(?:\| )?[A-H]\d{2} \|/.test(line)) continue;
    const c = line.startsWith('|') ? splitMarkdown(line) : line.split('|').map(x => x.trim());
    independent.set(c[0], {
      happy: c[1].replace(/^H:/, ''),
      edge: c[2].replace(/^E:/, ''),
      failure: c[3].replace(/^F:/, ''),
      catalogPath
    });
  }
}

// v7.3.4 critic이 source literal과 별개로 빠졌다고 판정한 observable predicate 8행.
// 이 supplement는 emitted manifest의 H/E/F 본문이며 validator가 실제 파일에서 exact equality를 검사한다.
const semanticSupplements = {
  A02: {
    happy: 'Fresh identities A and B without invites each create one workspace; tenant IDs A and B are both present and A is not equal to B.',
    edge: 'Even when both identities choose the same display name, tenant IDs and owner memberships remain distinct.',
    failure: 'Cross-identity membership, source, draft, account, job and metric reads/writes all return zero records and mutations.'
  },
  A03: {
    happy: 'A confirmed workspace A to B switch changes source, draft, account, Queue and analytics to the same B workspace ID after server readback.',
    edge: 'If one projection is loading or stale, the switch remains partial/reconciling and commands are disabled with that surface named.',
    failure: 'Any projection still pointing to A prevents success and B commands; cancel or failure retains A atomically.'
  },
  B01: {
    happy: 'An imported claim opened in Studio claim inspector resolves to the exact imported tenant, document locator and source span and is usable by retrieval.',
    edge: 'A skipped or malformed document exposes counts and an unusable-citation reason while citations from valid imported documents still resolve.',
    failure: 'Metadata-only import, unresolved citation, or citation to the wrong tenant/document/span cannot report usable import success.'
  },
  B10: {
    happy: 'Positioning, audience, promise, proof, taboo and vocabulary fields6 edit, validate, save and reload exactly, with actor and changed fields audited.',
    edge: 'An invalid required field or stale version shows validation/conflict and leaves the active guide unchanged.',
    failure: 'Save failure or stale overwrite produces success copy0, partial persistence0 and preserves the prior draft and active version.'
  },
  B13: {
    happy: 'The artifact lineage chip stores, reloads and shows the used guide version, exact applied rules and immutable applied_at timestamp.',
    edge: 'Regeneration or rollback-created guide version makes a new artifact revision with a new applied_at while the old artifact keeps its original values.',
    failure: 'Missing, inferred-current or rewritten applied_at, or binding to current active guide instead of used snapshot, fails lineage and publication eligibility.'
  },
  D01: {
    happy: 'At 1440, 1024 and 390, Studio DOM, visual and keyboard order is Text position1, Photo/Card position2, Video position3, and jump targets reach the same rails.',
    edge: 'An incomplete or blocked rail stays in its numbered position and exposes exact incomplete or blocker truth without reordering.',
    failure: 'Any viewport DOM/visual/keyboard/jump mismatch fails D01; a general route screenshot contributes PASS0.'
  },
  D20: {
    happy: 'A healthy identified Telegram bot, selected chat, approved preview and future schedule produce one record with bot health, approval, schedule and terminal result.',
    edge: 'Degraded or revoked bot health, changed chat, stale approval or past time exposes exact state and repair or reapproval action while preserving the draft.',
    failure: 'Unknown or unhealthy bot, unapproved content or stale target produces send and schedule calls0 and false scheduled or success result0.'
  },
  E02: {
    happy: 'Bulk impact preview and confirmation show selected count plus the exact ordered selected account list, compatible field, exclusions and before/after impact.',
    edge: 'Selection, account permission or capability change stales confirmation, shows the exact diff and requires a new preview.',
    failure: 'Hidden or wrong account, count/list mismatch or stale confirmation produces bulk mutation0 and sibling hash changes0.'
  }
};

const ids = [...source.keys()].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

function expectedRows() {
  return ids.map(id => {
    const s = source.get(id);
    const mapping = rtm.get(id) ?? {};
    const baseReview = independent.get(id);
    const review = semanticSupplements[id] ?? baseReview ?? {};
    const release = mapping.release ?? '';
    return {
      id,
      contract: s.contract,
      action: s.action,
      failureEvidence: s.failure,
      mapping: mapping.mapping ?? '',
      happy: 'QA-AUD-' + id + '-H: Source contract exact “' + s.contract + '” and source action exact “' + s.action + '”. Observable assertion: ' + (review.happy ?? 'MISSING H ASSERTION'),
      edge: 'QA-AUD-' + id + '-E: Source action exact “' + s.action + '” and source evidence exact “' + s.failure + '”. Edge assertion: ' + (review.edge ?? 'MISSING E ASSERTION'),
      failure: 'QA-AUD-' + id + '-F: Source failure exact “' + s.failure + '”. Forbidden/failure assertion: ' + (review.failure ?? 'MISSING F ASSERTION') + ' If one required predicate is absent, changed or contradicted, QA-AUD-' + id + ', ' + (release || 'MISSING_RELEASE') + ' and the Audit96 aggregate all FAIL. Numeric 96, hash equality, route reachability and prior-critic silence contribute PASS0.',
      release
    };
  });
}

const escapeCell = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');

function emitManifest(rows) {
  const out = [];
  out.push('# Audit96 exact source → happy/edge/failure TC manifest — PRD v7.3.5');
  out.push('');
  out.push('SOURCE_AUDIT: ' + auditPath);
  out.push('SOURCE_SHA256: ' + sha256(audit));
  out.push('PRD: ' + prdPath);
  out.push('PRD_SHA256: ' + sha256(prd));
  out.push('SOURCE_ROWS: ' + rows.length);
  out.push('ASSERTIONS: ' + rows.length * 3);
  out.push('GENERATOR_SCHEMA: actual-manifest-v1');
  out.push('SEMANTIC_POLICY: row/hash/count/prior-critic silence cannot certify meaning. Each emitted row pins source contract/action/failure and exact observable H/E/F. Independent critic remains the semantic gate.');
  out.push('');
  out.push('| Audit | Exact source contract | Exact required action/state | Exact source failure evidence | Mapped FR→AC→TC + QA TC | Happy assertion | Edge assertion | Failure assertion | Release |');
  out.push('|---|---|---|---|---|---|---|---|---|');
  for (const row of rows) {
    out.push('| ' + [
      row.id,
      row.contract,
      row.action,
      row.failureEvidence,
      row.mapping,
      row.happy,
      row.edge,
      row.failure,
      row.release
    ].map(escapeCell).join(' | ') + ' |');
  }
  out.push('');
  out.push('MUTATION_POLICY: canonical manifest is immutable during testing. Copy it into a mktemp -d path, remove the B10 happy source-action predicate only in that copy, validate the copy, and prove canonical SHA before/after equality.');
  out.push('SELF_CERTIFICATION: 0 — emitted-file validation proves artifact integrity and mutation teeth, not independent semantic acceptance.');
  fs.writeFileSync(canonicalManifestPath, out.join('\n') + '\n');
}

function parseManifest(content) {
  const headers = {};
  const rows = new Map();
  const schemaFailures = [];
  for (const line of content.split('\n')) {
    const header = line.match(/^([A-Z0-9_]+): (.*)$/);
    if (header) headers[header[1]] = header[2];
    if (!/^\| [A-H]\d{2} \|/.test(line)) continue;
    const c = splitMarkdown(line);
    if (c.length !== 9) {
      schemaFailures.push({ line: line.slice(0, 80), columns: c.length });
      continue;
    }
    if (rows.has(c[0])) schemaFailures.push({ duplicate: c[0] });
    rows.set(c[0], {
      id: c[0],
      contract: c[1],
      action: c[2],
      failureEvidence: c[3],
      mapping: c[4],
      happy: c[5],
      edge: c[6],
      failure: c[7],
      release: c[8]
    });
  }
  return { headers, rows, schemaFailures };
}

function validateActual(actualPath) {
  const content = fs.readFileSync(actualPath, 'utf8');
  const actual = parseManifest(content);
  const expected = new Map(expectedRows().map(row => [row.id, row]));
  const headerChecks = {
    source_sha_exact: actual.headers.SOURCE_SHA256 === sha256(audit),
    prd_sha_exact: actual.headers.PRD_SHA256 === sha256(prd),
    source_rows_96: actual.headers.SOURCE_ROWS === '96',
    assertions_288: actual.headers.ASSERTIONS === '288',
    generator_schema: actual.headers.GENERATOR_SCHEMA === 'actual-manifest-v1',
    parsed_rows_96: actual.rows.size === 96,
    schema_failures_0: actual.schemaFailures.length === 0
  };
  const rowFailures = [];
  for (const id of ids) {
    const row = actual.rows.get(id);
    const exp = expected.get(id);
    if (!row) {
      rowFailures.push({ id, missing: ['manifest_row'] });
      continue;
    }
    const checks = {
      source_contract_exact: row.contract === exp.contract,
      source_action_exact: row.action === exp.action,
      source_failure_exact: row.failureEvidence === exp.failureEvidence,
      mapping_exact: row.mapping === exp.mapping,
      happy_assertion_exact: row.happy === exp.happy,
      edge_assertion_exact: row.edge === exp.edge,
      failure_assertion_exact: row.failure === exp.failure,
      release_exact: row.release === exp.release && row.release === 'RC-AUD-' + id,
      source_action_in_happy: row.happy.includes(exp.action),
      source_action_in_edge: row.edge.includes(exp.action),
      source_failure_in_edge: row.edge.includes(exp.failureEvidence),
      source_failure_in_failure: row.failure.includes(exp.failureEvidence),
      qa_ids_exact: row.happy.startsWith('QA-AUD-' + id + '-H:') && row.edge.startsWith('QA-AUD-' + id + '-E:') && row.failure.startsWith('QA-AUD-' + id + '-F:'),
      exact_mapping_present: row.mapping.includes('→AC') && row.mapping.includes('→TC') && row.mapping.includes('QA-AUD-' + id + '-H/E/F'),
      mutation_teeth_declared: row.failure.includes(row.release + ' and the Audit96 aggregate all FAIL'),
      mutation_placeholder_absent: !row.happy.includes('[REMOVED_') && !row.edge.includes('[REMOVED_') && !row.failure.includes('[REMOVED_')
    };
    const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
    if (missing.length) rowFailures.push({ id, missing });
  }
  const headerFailures = Object.entries(headerChecks).filter(([, ok]) => !ok).map(([name]) => name);
  const failedRows = rowFailures.length;
  return {
    artifact: 'marketing-agent-v7.3.5-audit96-actual-manifest-validator',
    manifest_path: actualPath,
    manifest_sha256: sha256(content),
    source_sha256: sha256(audit),
    prd_sha256: sha256(prd),
    source_rows: source.size,
    parsed_manifest_rows: actual.rows.size,
    assertions: actual.rows.size * 3,
    independent_catalog_rows: independent.size,
    supplemented_semantic_rows: Object.keys(semanticSupplements),
    header_failures: headerFailures,
    schema_failures: actual.schemaFailures,
    row_failures: rowFailures,
    failed_rows: failedRows,
    aggregate: headerFailures.length === 0 && actual.schemaFailures.length === 0 && failedRows === 0 ? 'PASS' : 'FAIL',
    self_certification_boundary: 'This validator reads the emitted manifest and proves exact artifact/schema/predicate/assertion integrity. Independent plan-critic still owns semantic acceptance.'
  };
}

if (emit) emitManifest(expectedRows());
if (!fs.existsSync(manifestPath)) throw new Error('manifest not found: ' + manifestPath);
const summary = validateActual(manifestPath);
if (jsonPath) fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.aggregate === 'PASS' ? 0 : 1);
