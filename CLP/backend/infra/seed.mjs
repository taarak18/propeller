// Seed script for the LearnTrack POC. Node 18+ (global fetch). Run after `docker compose up`.
//   node infra/seed.mjs
// Mints a dev token, creates employees, then ingests attendance/assessments/milestones
// which flows ingestion -> profile -> risk -> intervention/reporting via Kafka.

const PROFILE = process.env.PROFILE_URL || 'http://localhost:8082';
const INGEST = process.env.INGEST_URL || 'http://localhost:8081';
const TENANT = process.env.TENANT || 'tenant_acme_corp';

const uuid = () => crypto.randomUUID();

async function main() {
  // 1. Mint dev token (LD_ADMIN)
  const tokRes = await fetch(`${PROFILE}/api/auth/dev-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'u_seed', tenantId: TENANT, name: 'Seed Admin', roles: ['LD_ADMIN'] }),
  });
  if (!tokRes.ok) throw new Error('dev-token failed: ' + tokRes.status);
  const { token } = await tokRes.json();
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  console.log('✓ minted dev token for', TENANT);

  // profile: target attendance %, score %, trend (down => later assessments lower)
  const employees = [
    { employeeId: 'EMP-8492', firstName: 'Sarah', lastName: 'Jenkins', department: 'Customer Support', jobTitle: 'Support Specialist', workEmail: 'sarah.jenkins@acme.test', att: 55, score: 48, trend: 'down' },
    { employeeId: 'EMP-4472', firstName: 'James', lastName: 'Smith', department: 'Sales', jobTitle: 'Account Executive', workEmail: 'james.smith@acme.test', att: 62, score: 56, trend: 'down' },
    { employeeId: 'EMP-6610', firstName: 'Carlos', lastName: 'Rivera', department: 'Sales', jobTitle: 'Sales Rep', workEmail: 'carlos.rivera@acme.test', att: 70, score: 88, trend: 'down' },
    { employeeId: 'EMP-3321', firstName: 'David', lastName: 'Rodriguez', department: 'Sales', jobTitle: 'Sales Rep', workEmail: 'david.rodriguez@acme.test', att: 72, score: 84, trend: 'stable' },
    { employeeId: 'EMP-9103', firstName: 'Marcus', lastName: 'Chen', department: 'Engineering', jobTitle: 'Engineer', workEmail: 'marcus.chen@acme.test', att: 94, score: 66, trend: 'down' },
    { employeeId: 'EMP-5581', firstName: 'Priya', lastName: 'Patel', department: 'HR', jobTitle: 'HR Partner', workEmail: 'priya.patel@acme.test', att: 90, score: 71, trend: 'down' },
    { employeeId: 'EMP-1001', firstName: 'Anna', lastName: 'Lee', department: 'Engineering', jobTitle: 'Engineer', workEmail: 'anna.lee@acme.test', att: 98, score: 92, trend: 'stable' },
    { employeeId: 'EMP-1002', firstName: 'Ben', lastName: 'Carter', department: 'Finance', jobTitle: 'Analyst', workEmail: 'ben.carter@acme.test', att: 95, score: 88, trend: 'stable' },
    { employeeId: 'EMP-1003', firstName: 'Cara', lastName: 'Diaz', department: 'Marketing', jobTitle: 'Specialist', workEmail: 'cara.diaz@acme.test', att: 99, score: 95, trend: 'stable' },
    { employeeId: 'EMP-1004', firstName: 'Dan', lastName: 'Owens', department: 'Engineering', jobTitle: 'Engineer', workEmail: 'dan.owens@acme.test', att: 93, score: 90, trend: 'stable' },
  ];

  // 2. Create employees
  for (const e of employees) {
    const res = await fetch(`${PROFILE}/api/v1/employees`, { method: 'POST', headers: H, body: JSON.stringify(e) });
    if (!res.ok) console.warn('  ! create employee', e.employeeId, res.status, await res.text());
  }
  console.log(`✓ created ${employees.length} employees`);

  const dateDaysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);

  // 3. Attendance batch
  const attendance = [];
  for (const e of employees) {
    const total = 10;
    const present = Math.round((e.att / 100) * total);
    for (let i = 0; i < total; i++) {
      attendance.push({
        employeeId: e.employeeId,
        sessionDate: dateDaysAgo(total - i),
        sessionType: 'Instructor-Led',
        trainingModule: 'Mandatory Compliance 2026',
        status: i < present ? 'PRESENT' : 'ABSENT',
        reason: i < present ? '' : 'No show',
      });
    }
  }
  await post(`${INGEST}/api/v1/ingest/training-attendance`, H, { records: attendance });
  console.log(`✓ ingested ${attendance.length} attendance records`);

  // 4. Assessments batch (4 each; trend=down makes later scores lower)
  const assessments = [];
  for (const e of employees) {
    const n = 4;
    for (let i = 0; i < n; i++) {
      let pct = e.score;
      if (e.trend === 'down') pct = e.score + (n - 1 - i) * 6; // older higher, newer lower
      pct = Math.max(0, Math.min(100, pct));
      assessments.push({
        employeeId: e.employeeId,
        competency: 'Data Privacy',
        trainingModule: 'Mandatory Compliance 2026',
        assessmentName: `Assessment ${i + 1}`,
        score: pct,
        maxScore: 100,
        assessmentDate: dateDaysAgo((n - i) * 7),
        rating: pct >= 80 ? 'Meets_Expectations' : pct >= 60 ? 'Needs_Improvement' : 'Unsatisfactory',
      });
    }
  }
  await post(`${INGEST}/api/v1/ingest/assessments`, H, { records: assessments });
  console.log(`✓ ingested ${assessments.length} assessment records`);

  // 5. Milestones
  const milestones = employees.map((e) => ({
    employeeId: e.employeeId,
    milestoneName: 'Data Privacy Certification',
    competency: 'Data Privacy',
    status: e.score >= 70 ? 'COMPLETED' : 'IN_PROGRESS',
    completionDate: e.score >= 70 ? dateDaysAgo(10) : null,
    proficiencyLevel: e.score >= 80 ? 'Advanced' : 'Intermediate',
  }));
  await post(`${INGEST}/api/v1/ingest/competency-milestones`, H, { records: milestones });
  console.log(`✓ ingested ${milestones.length} milestone records`);

  console.log('\nSeed complete. Allow a few seconds for Kafka events to flow, then open the dashboard.');
}

async function post(url, H, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...H, 'Idempotency-Key': uuid() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url} -> ${res.status} ${await res.text()}`);
  return res.json().catch(() => ({}));
}

main().catch((e) => { console.error('SEED FAILED:', e.message); process.exit(1); });
