// Vtiger CRM REST API adapter
// Docs: https://code.vtiger.com/vtiger/vtigercrm-manual/blob/master/vtigerCRM6.2_Rest_API.md
//
// Auth flow per request (stateless — no session caching):
//   1. GET getchallenge → token
//   2. POST login with md5(token + accessKey) → sessionName
//   3. Execute operation with sessionName
//
// Each client has their own Vtiger instance (open-source, self-hosted).
// Credentials come from clients.integrations->vtiger in Supabase.

import { createHash } from 'crypto'

export interface VtigerConfig {
  instance_url: string   // e.g. https://crm.clientdomain.com
  username: string
  access_key: string     // Vtiger Access Key from My Profile → Access Credentials
}

export interface VtigerContact {
  id: string
  module: 'Leads' | 'Contacts'
  customer_status: 'existing_lead' | 'existing_contact' | 'new'
  firstname: string
  lastname: string
  company: string
  email: string
  phone: string
  mobile: string
  description: string
  leadsource?: string
  leadstatus?: string
  vtiger_no: string      // e.g. LEA12345 or CON12345
}

export interface CreateLeadInput {
  firstname: string
  lastname: string
  company?: string
  email?: string
  phone?: string
  mobile?: string
  description?: string
  leadsource?: string
  leadstatus?: string
  assigned_user_id?: string   // Vtiger internal user ID e.g. "19x5"
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function md5(str: string): string {
  return createHash('md5').update(str).digest('hex')
}

function apiUrl(instanceUrl: string): string {
  const base = instanceUrl.replace(/\/$/, '')
  return `${base}/webservice.php`
}

/**
 * Safe JSON parser — reads the response body as text first, then parses.
 * Throws a descriptive error if the body is empty or not valid JSON
 * (e.g. Vtiger returned an HTML error page or a blank response).
 */
async function safeJson<T>(res: Response, context: string): Promise<T> {
  const text = await res.text()
  if (!text || text.trim() === '') {
    throw new Error(`Vtiger ${context}: server returned an empty response (HTTP ${res.status}). Check the instance URL and server health.`)
  }
  try {
    return JSON.parse(text) as T
  } catch {
    const preview = text.slice(0, 120).replace(/\s+/g, ' ')
    throw new Error(`Vtiger ${context}: response was not valid JSON (HTTP ${res.status}). Server returned: "${preview}"`)
  }
}

/**
 * Normalize a phone number into all common variants for Vtiger queries.
 * Handles:
 *   +27827728254  → international with plus
 *   27827728254   → international without plus
 *   0827728254    → South African local format
 *   0082-772-8254 → various formats with dashes/spaces
 * Returns { international, withPlus, local } so the query can match any stored format.
 */
function normalizePhone(phone: string): { international: string; withPlus: string; local: string } {
  // Strip whitespace, dashes, parentheses, dots
  const cleaned = phone.replace(/[\s\-().]/g, '')

  let digits: string  // core digits without country code

  if (cleaned.startsWith('+27') && cleaned.length >= 11) {
    // +27827728254 → digits = "827728254"
    digits = cleaned.substring(3)
  } else if (cleaned.startsWith('27') && cleaned.length >= 11) {
    // 27827728254 → digits = "827728254"
    digits = cleaned.substring(2)
  } else if (cleaned.startsWith('0') && cleaned.length >= 9) {
    // 0827728254 → digits = "827728254"
    digits = cleaned.substring(1)
  } else {
    // Unknown format — use as-is for all variants
    digits = cleaned
  }

  return {
    international: `27${digits}`,     // 27827728254
    withPlus:      `+27${digits}`,    // +27827728254
    local:         `0${digits}`,      // 0827728254
  }
}

// ── Session management ─────────────────────────────────────────────────────────
// A fresh session is obtained on every request (no caching).
// Returns both sessionName and the logged-in user's Vtiger userId (e.g. "19x1")
// which is required as assigned_user_id when creating ModComments.

async function getSessionData(config: VtigerConfig): Promise<{ sessionName: string; userId: string }> {
  const url = apiUrl(config.instance_url)

  // Step 1: Get challenge token
  const challengeRes = await fetch(
    `${url}?operation=getchallenge&username=${encodeURIComponent(config.username)}`,
    { method: 'GET' }
  )

  if (!challengeRes.ok) {
    throw new Error(`Vtiger getchallenge failed: HTTP ${challengeRes.status} at ${url}`)
  }

  const challengeData = await safeJson<{
    success: boolean
    result?: { token: string }
    error?: { message: string }
  }>(challengeRes, 'getchallenge')

  if (!challengeData.success || !challengeData.result?.token) {
    throw new Error(
      `Vtiger getchallenge error: ${challengeData.error?.message || 'No token returned'}`
    )
  }

  const token = challengeData.result.token
  const computedKey = md5(token + config.access_key)

  // Step 2: Login and get sessionName + userId
  const loginBody = new URLSearchParams({
    operation: 'login',
    username: config.username,
    accessKey: computedKey,
  })

  const loginRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: loginBody.toString(),
  })

  if (!loginRes.ok) {
    throw new Error(`Vtiger login failed: HTTP ${loginRes.status}`)
  }

  const loginData = await safeJson<{
    success: boolean
    result?: { sessionName: string; userId: string }
    error?: { message: string }
  }>(loginRes, 'login')

  if (!loginData.success || !loginData.result?.sessionName) {
    throw new Error(
      `Vtiger login error: ${loginData.error?.message || 'Invalid credentials or access key'}`
    )
  }

  return {
    sessionName: loginData.result.sessionName,
    userId: loginData.result.userId || '',
  }
}

// Convenience wrapper — returns only the sessionName (used by search/query helpers)
async function getSession(config: VtigerConfig): Promise<string> {
  const { sessionName } = await getSessionData(config)
  return sessionName
}

// ── Search ─────────────────────────────────────────────────────────────────────

/**
 * Search for an existing contact by phone number.
 * Checks Leads first, then Contacts.
 * Handles all common SA phone formats: +27..., 27..., 0...
 */
export async function searchByPhone(
  config: VtigerConfig,
  phone: string
): Promise<VtigerContact | null> {
  const sessionName = await getSession(config)
  const url = apiUrl(config.instance_url)
  const { international, withPlus, local } = normalizePhone(phone)

  // Try Leads first — search both 'phone' and 'mobile' columns
  const leadQuery = `SELECT * FROM Leads WHERE mobile = '${international}' OR mobile = '${withPlus}' OR mobile = '${local}' OR phone = '${international}' OR phone = '${withPlus}' OR phone = '${local}' LIMIT 1;`
  const leadRes = await fetch(
    `${url}?operation=query&sessionName=${encodeURIComponent(sessionName)}&query=${encodeURIComponent(leadQuery)}`
  )
  const leadData = await safeJson<{
    success: boolean
    result?: Record<string, string>[]
    error?: { message: string }
  }>(leadRes, 'query(Leads)')

  if (leadData.success && leadData.result && leadData.result.length > 0) {
    const r = leadData.result[0]
    return {
      id: r.id,
      module: 'Leads',
      customer_status: 'existing_lead',
      firstname: r.firstname || '',
      lastname: r.lastname || '',
      company: r.company || '',
      email: r.email || '',
      phone: r.phone || '',
      mobile: r.mobile || '',
      description: r.description || '',
      leadsource: r.leadsource,
      leadstatus: r.leadstatus,
      vtiger_no: r.lead_no || '',
    }
  }

  // Try Contacts
  const contactQuery = `SELECT * FROM Contacts WHERE mobile = '${international}' OR mobile = '${withPlus}' OR mobile = '${local}' OR phone = '${international}' OR phone = '${withPlus}' OR phone = '${local}' LIMIT 1;`
  const contactRes = await fetch(
    `${url}?operation=query&sessionName=${encodeURIComponent(sessionName)}&query=${encodeURIComponent(contactQuery)}`
  )
  const contactData = await safeJson<{
    success: boolean
    result?: Record<string, string>[]
    error?: { message: string }
  }>(contactRes, 'query(Contacts)')

  if (contactData.success && contactData.result && contactData.result.length > 0) {
    const r = contactData.result[0]
    return {
      id: r.id,
      module: 'Contacts',
      customer_status: 'existing_contact',
      firstname: r.firstname || '',
      lastname: r.lastname || '',
      company: r.account_id || '',
      email: r.email || '',
      phone: r.phone || '',
      mobile: r.mobile || '',
      description: r.description || '',
      vtiger_no: r.contact_no || '',
    }
  }

  return null
}

/**
 * Search for a contact/lead by email address.
 */
export async function searchByEmail(
  config: VtigerConfig,
  email: string
): Promise<VtigerContact | null> {
  const sessionName = await getSession(config)
  const url = apiUrl(config.instance_url)
  const safeEmail = email.replace(/'/g, "''")

  // Try Leads first
  const leadQuery = `SELECT * FROM Leads WHERE email = '${safeEmail}' LIMIT 1;`
  const leadRes = await fetch(
    `${url}?operation=query&sessionName=${encodeURIComponent(sessionName)}&query=${encodeURIComponent(leadQuery)}`
  )
  const leadData = await safeJson<{
    success: boolean
    result?: Record<string, string>[]
    error?: { message: string }
  }>(leadRes, 'query(Leads by email)')

  if (leadData.success && leadData.result && leadData.result.length > 0) {
    const r = leadData.result[0]
    return {
      id: r.id,
      module: 'Leads',
      customer_status: 'existing_lead',
      firstname: r.firstname || '',
      lastname: r.lastname || '',
      company: r.company || '',
      email: r.email || '',
      phone: r.phone || '',
      mobile: r.mobile || '',
      description: r.description || '',
      leadsource: r.leadsource,
      leadstatus: r.leadstatus,
      vtiger_no: r.lead_no || '',
    }
  }

  // Try Contacts
  const contactQuery = `SELECT * FROM Contacts WHERE email = '${safeEmail}' LIMIT 1;`
  const contactRes = await fetch(
    `${url}?operation=query&sessionName=${encodeURIComponent(sessionName)}&query=${encodeURIComponent(contactQuery)}`
  )
  const contactData = await safeJson<{
    success: boolean
    result?: Record<string, string>[]
    error?: { message: string }
  }>(contactRes, 'query(Contacts by email)')

  if (contactData.success && contactData.result && contactData.result.length > 0) {
    const r = contactData.result[0]
    return {
      id: r.id,
      module: 'Contacts',
      customer_status: 'existing_contact',
      firstname: r.firstname || '',
      lastname: r.lastname || '',
      company: r.account_id || '',
      email: r.email || '',
      phone: r.phone || '',
      mobile: r.mobile || '',
      description: r.description || '',
      vtiger_no: r.contact_no || '',
    }
  }

  return null
}

/**
 * Run a custom VQL query. Returns raw Vtiger result rows.
 */
export async function runQuery(
  config: VtigerConfig,
  query: string
): Promise<Record<string, unknown>[]> {
  const sessionName = await getSession(config)
  const url = apiUrl(config.instance_url)

  const res = await fetch(
    `${url}?operation=query&sessionName=${encodeURIComponent(sessionName)}&query=${encodeURIComponent(query)}`
  )
  const data = await safeJson<{
    success: boolean
    result?: Record<string, unknown>[]
    error?: { message: string }
  }>(res, 'query')

  if (!data.success) {
    throw new Error(`Vtiger query error: ${data.error?.message || 'Unknown error'}`)
  }

  return data.result || []
}

// ── Create ─────────────────────────────────────────────────────────────────────

/**
 * Create a new Lead in Vtiger. Returns the created record's ID and lead_no.
 */
export async function createLead(
  config: VtigerConfig,
  data: CreateLeadInput
): Promise<{ id: string; lead_no: string }> {
  const sessionName = await getSession(config)
  const url = apiUrl(config.instance_url)

  const element = JSON.stringify({
    firstname: data.firstname,
    lastname: data.lastname,
    company: data.company || 'Unknown',
    email: data.email || '',
    phone: data.phone || '',
    mobile: data.mobile || '',
    description: data.description || '',
    leadsource: data.leadsource || 'Web Site',
    leadstatus: data.leadstatus || 'New',
    ...(data.assigned_user_id ? { assigned_user_id: data.assigned_user_id } : {}),
  })

  const body = new URLSearchParams({
    operation: 'create',
    sessionName,
    elementType: 'Leads',
    element,
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const result = await safeJson<{
    success: boolean
    result?: { id: string; lead_no: string }
    error?: { message: string }
  }>(res, 'create(Lead)')

  if (!result.success || !result.result?.id) {
    throw new Error(`Vtiger createLead error: ${result.error?.message || 'Unknown error'}`)
  }

  return { id: result.result.id, lead_no: result.result.lead_no }
}

// ── Update ─────────────────────────────────────────────────────────────────────

/**
 * Update any fields on an existing Vtiger record.
 * Retrieves the full record first to avoid clobbering existing fields.
 */
// Vtiger module-ID → VQL table name (used as fallback for retrieve)
const VTIGER_MODULE_MAP: Record<string, string> = {
  '4':  'Leads',
  '12': 'Contacts',
  '6':  'Accounts',
  '9':  'Potentials',
  '13': 'Cases',
}

export async function updateRecord(
  config: VtigerConfig,
  recordId: string,
  updates: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const sessionName = await getSession(config)
  const url = apiUrl(config.instance_url)

  // ── Step 1: Get the full current record ────────────────────────────────────
  // Try retrieve first (fastest); fall back to VQL query if permission is denied.
  // Some Vtiger profiles allow VQL SELECT on all records but restrict retrieve to owned records.
  let fullRecord: Record<string, unknown> | null = null

  const retrieveRes = await fetch(
    `${url}?operation=retrieve&sessionName=${encodeURIComponent(sessionName)}&id=${encodeURIComponent(recordId)}`
  )
  const retrieveData = await safeJson<{
    success: boolean
    result?: Record<string, unknown>
    error?: { message: string }
  }>(retrieveRes, 'retrieve')

  if (retrieveData.success && retrieveData.result) {
    fullRecord = retrieveData.result
  } else {
    // Fallback: use VQL to get the full record (avoids retrieve permission check)
    const moduleId = recordId.split('x')[0]
    const moduleName = VTIGER_MODULE_MAP[moduleId]
    if (moduleName) {
      const fallbackQuery = `SELECT * FROM ${moduleName} WHERE id = '${recordId}' LIMIT 1;`
      const fallbackRes = await fetch(
        `${url}?operation=query&sessionName=${encodeURIComponent(sessionName)}&query=${encodeURIComponent(fallbackQuery)}`
      )
      const fallbackData = await safeJson<{
        success: boolean
        result?: Record<string, unknown>[]
        error?: { message: string }
      }>(fallbackRes, `query(${moduleName} by id)`)
      if (fallbackData.success && fallbackData.result && fallbackData.result.length > 0) {
        fullRecord = fallbackData.result[0]
      }
    }
    if (!fullRecord) {
      throw new Error(`Vtiger retrieve error: ${retrieveData.error?.message || 'Record not found'}`)
    }
  }

  // ── Step 2: Merge updates and send ─────────────────────────────────────────
  // Merge updates into the full record
  const element = JSON.stringify({ ...fullRecord, ...updates })

  const body = new URLSearchParams({
    operation: 'update',
    sessionName,
    element,
  })

  const updateRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const updateData = await safeJson<{
    success: boolean
    result?: Record<string, unknown>
    error?: { message: string }
  }>(updateRes, 'update')

  if (!updateData.success || !updateData.result) {
    throw new Error(`Vtiger update error: ${updateData.error?.message || 'Unknown error'}`)
  }

  return updateData.result
}

// ── Add Note / Comment ─────────────────────────────────────────────────────────

/**
 * Add a comment/note to any Vtiger record (Lead, Contact, etc.)
 */
export async function addNote(
  config: VtigerConfig,
  recordId: string,
  noteText: string
): Promise<{ id: string }> {
  // ModComments requires assigned_user_id — capture it from the login response
  const { sessionName, userId } = await getSessionData(config)
  const url = apiUrl(config.instance_url)

  const element = JSON.stringify({
    commentcontent: noteText,
    related_to: recordId,
    ...(userId ? { assigned_user_id: userId } : {}),
  })

  const body = new URLSearchParams({
    operation: 'create',
    sessionName,
    elementType: 'ModComments',
    element,
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const result = await safeJson<{
    success: boolean
    result?: { id: string }
    error?: { message: string }
  }>(res, 'create(ModComments)')

  if (!result.success || !result.result?.id) {
    throw new Error(`Vtiger addNote error: ${result.error?.message || 'Unknown error'}`)
  }

  return { id: result.result.id }
}

// ── Test connection ────────────────────────────────────────────────────────────

/**
 * Verify credentials by attempting to get a session.
 * Throws with a descriptive message on failure.
 */
export async function testConnection(config: VtigerConfig): Promise<{ success: true; username: string }> {
  await getSession(config)   // throws on failure with descriptive message
  return { success: true, username: config.username }
}
