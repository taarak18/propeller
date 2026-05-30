// Interactive-flow smoke test: human review, intervention approval, consent opt-out.
const T = 'tenant_acme_corp';
const tok = (await (await fetch('http://localhost:8082/api/auth/dev-token', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'u_admin', tenantId: T, name: 'Admin', roles: ['LD_ADMIN', 'LD_MANAGER'] }),
})).json()).token;
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` };
const get = async (u) => (await fetch(u, { headers: H })).json();
const send = async (m, u, b) => { const r = await fetch(u, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined }); return { ok: r.ok, status: r.status, body: await r.text() }; };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 1. Human review on the CRITICAL assessment
const atRisk = await get('http://localhost:8083/api/v1/risk/at-risk');
const critical = atRisk.find(r => r.riskLevel === 'CRITICAL');
console.log('1) Human review on', critical.employeeName, 'risk', critical.riskId);
console.log('   ', await send('POST', `http://localhost:8083/api/v1/risk/${critical.riskId}/review`, { decision: 'CONFIRMED', notes: 'Confirmed by L&D Manager' }));

// 2. Approve one intervention -> becomes ACTIVE
const ivs = await get('http://localhost:8084/api/v1/interventions');
const iv = ivs[0];
console.log('2) Approve intervention', iv.interventionId ?? iv.id, 'for', iv.employeeName ?? iv.employeeId);
console.log('   ', await send('PUT', `http://localhost:8084/api/v1/interventions/${iv.interventionId ?? iv.id}/approve`));

// 3. Consent opt-out for James (EMP-4472) -> risk suppressed + pseudonymised in report
console.log('3) Opt EMP-4472 out of risk_profiling');
console.log('   ', await send('DELETE', 'http://localhost:8085/api/v1/consents/EMP-4472/purpose/risk_profiling'));

await sleep(4000);
const after = await get('http://localhost:8083/api/v1/risk/at-risk');
console.log('   at-risk now:', after.map(r => r.employeeName).join(', '));
console.log('   EMP-4472 (James Smith) still at-risk?', after.some(r => r.employeeId === 'EMP-4472'));

const ivSummary = await get('http://localhost:8084/api/v1/interventions/summary');
console.log('   intervention summary:', JSON.stringify(ivSummary));

// 4. Generate a compliance report and confirm opted-out employee is pseudonymised
const rep = await (await fetch('http://localhost:8086/api/v1/reports/generate', { method: 'POST', headers: H, body: JSON.stringify({ templateType: 'COMPLIANCE_SUMMARY', period: 'YTD' }) })).json();
const csvRes = await fetch(`http://localhost:8086/api/v1/reports/${rep.reportId ?? rep.id}/download`, { headers: H });
const csv = await csvRes.text();
const jamesLine = csv.split('\n').find(l => l.includes('EMP-4472')) || '(not found)';
console.log('4) Report row for EMP-4472:', jamesLine.trim());
console.log('   pseudonymised?', jamesLine.includes('REDACTED'));
