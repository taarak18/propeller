// Quick end-to-end verification of the event chain for tenant_acme_corp.
const TENANT = process.env.TENANT || 'tenant_acme_corp';
const tok = (await (await fetch('http://localhost:8082/api/auth/dev-token', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'u_verify', tenantId: TENANT, name: 'Verify', roles: ['LD_ADMIN'] }),
})).json()).token;
const H = { Authorization: `Bearer ${tok}` };
const get = async (u) => { const r = await fetch(u, { headers: H }); return r.ok ? r.json() : `ERR ${r.status} ${await r.text()}`; };

const employees = await get('http://localhost:8082/api/v1/employees');
const atRisk = await get('http://localhost:8083/api/v1/risk/at-risk');
const summary = await get('http://localhost:8083/api/v1/risk/summary');
const dash = await get('http://localhost:8086/api/v1/dashboard/summary');
const interventions = await get('http://localhost:8084/api/v1/interventions');

console.log('employees:', Array.isArray(employees) ? employees.length : employees);
console.log('risk summary:', JSON.stringify(summary));
console.log('at-risk count:', Array.isArray(atRisk) ? atRisk.length : atRisk);
if (Array.isArray(atRisk)) atRisk.forEach(r => console.log('   -', r.employeeName, r.riskLevel, '| review:', r.reviewStatus, '|', r.trigger, r.metric));
console.log('interventions:', Array.isArray(interventions) ? interventions.length : interventions);
console.log('dashboard kpis:', JSON.stringify(dash.kpis));
console.log('dashboard riskDistribution:', JSON.stringify(dash.riskDistribution));
