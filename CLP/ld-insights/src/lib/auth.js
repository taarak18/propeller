// Dev auth for the POC. Mints an HS256 JWT from any service's /api/auth/dev-token
// (proxied to profile-service) and stores it locally. No real IdP.

const TOKEN_KEY = 'lt_token'
const PRINCIPAL_KEY = 'lt_principal'

export const TENANTS = [
  { id: 'tenant_acme_corp', name: 'Acme Corp (Pro)' },
  { id: 'tenant_globex_ltd', name: 'Globex Ltd (Starter)' },
]

export const ROLES = ['LD_ADMIN', 'LD_MANAGER', 'TRAINER', 'EMPLOYEE']

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getPrincipal() {
  const raw = localStorage.getItem(PRINCIPAL_KEY)
  return raw ? JSON.parse(raw) : null
}

export function isLoggedIn() {
  return !!getToken()
}

export async function devLogin({ userId = 'u_admin', tenantId, name = 'Demo Admin', roles = ['LD_ADMIN'] }) {
  const res = await fetch('/api/auth/dev-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, tenantId, name, roles }),
  })
  if (!res.ok) throw new Error('Dev login failed')
  const { token } = await res.json()
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(PRINCIPAL_KEY, JSON.stringify({ userId, tenantId, name, roles }))
  return token
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(PRINCIPAL_KEY)
}
