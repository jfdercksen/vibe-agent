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

// ── Session management ─────────────────────────────────────────────────────────
// A fresh session is obtained on every request (no caching).
// Vtiger sessions typically last 1 hour — caching can be added later if needed.

async function getSession(config: VtigerConfig): Promise<string> {
  const url = apiUrl(config.instance_url)

  // Step 1: Get challenge token
  const challengeRes = await fetch(
    `${url}?operation=getchallenge&username=${encodeURIComponent(config.username)}`,
    { method: 'GET' }
  )

  if (!challengeRes.ok) {
    throw new Error(`Vtiger getchallenge failed: HTTP ${challengeRes.status}`)
  }

  const challengeData = await challengeRes.json() as {
    success: boolean
    result?: { token: string }
    error?: { message: string }
  }

  if (!challengeData.success || !challengeData.result?.token) {
    throw new Error(
      `Vtiger getchallenge error: ${challengeData.error?.message || 'Unknown error'}`
    )
  }

  const token = challengeData.result.token
  const computedKey = md5(token + config.access_key)

  // Step 2: Login and get sessionName
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

  const loginData = await loginRes.json() as {
    success: boolean
    result?: { sessionName: string }
    error?: { message: string }
  }

  if (!loginData.success || !loginData.result?.sessionName) {
    throw new Error(
      `Vtiger login error: ${loginData.error?.message || 'Invalid credentials'}`
    )
  }

  return loginData.result.sessionName
}

// ── Search ─────────────────────────────────────────────────────────────────────

/**
 * Search for an existing contact by phone number.
 * Checks Leads first, then Contacts (same logic as the original n8n workflows).
 * Handles +27, 027, and 27 phone number format variations.
 */
export async function searchByPhone(
  config: VtigerConfig,
  phone: string
): Promise<VtigerContact | null> {
  const sessionName = await getSession(config)
  const url = apiUrl(config.instance_url)

  // Normalize phone — strip leading + and leading zeros
  const stripped = phone.replace(/^\+/, '')        // "27785676780"
  const withZero = `0${stripped.substring(2)}`     // "0785676780"
  const withPlus = `+${stripped}`                  // "+27785676780"

  // Try Leads first
  const leadQuery = `SELECT * FROM Leads WHERE mobile = '${stripped}' OR mobile = '${withPlus}' OR mobile = '${withZero}' LIMIT 1;`
  const leadRes = await fetch(
    `${url}?operation=query&sessionName=${encodeURIComponent(sessionName)}&query=${encodeURIComponent(leadQuery)}`
  )
  const leadData = await leadRes.json() as {
    success: boolean
    result?: Record<string, string>[]
  }

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

  // Try Contacts if not in Leads
  const contactQuery = `SELECT * FROM Contacts WHERE mobile = '${stripped}' OR mobile = '${withPlus}' OR mobile = '${withZero}' LIMIT 1;`
  const contactRes = await fetch(
    `${url}?operation=query&sessionName=${encodeURIComponent(sessionName)}&query=${encodeURIComponent(contactQuery)}`
  )
  const contactData = await contactRes.json() as {
    success: boolean
    result?: Record<string, string>[]
  }

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

  // Try Leads first
  const leadQuery = `SELECT * FROM Leads WHERE email = '${email.replace(/'/g, "''")}' LIMIT 1;`
  const leadRes = await fetch(
    `${url}?operation=query&sessionName=${encodeURIComponent(sessionName)}&query=${encodeURIComponent(leadQuery)}`
  )
  const leadData = await leadRes.json() as {
    success: boolean
    result?: Record<string, string>[]
  }

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
  const contactQuery = `SELECT * FROM Contacts WHERE email = '${email.replace(/'/g, "''")}' LIMIT 1;`
  const contactRes = await fetch(
    `${url}?operation=query&sessionName=${encodeURIComponent(sessionName)}&query=${encodeURIComponent(contactQuery)}`
  )
  const contactData = await contactRes.json() as {
    success: boolean
    result?: Record<string, string>[]
  }

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
 * Example: query("SELECT * FROM Leads WHERE leadstatus = 'Hot' LIMIT 20;")
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
  const data = await res.json() as {
    success: boolean
    result?: Record<string, unknown>[]
    error?: { message: string }
  }

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

  const result = await res.json() as {
    success: boolean
    result?: { id: string; lead_no: string }
    error?: { message: string }
  }

  if (!result.success || !result.result?.id) {
    throw new Error(`Vtiger createLead error: ${result.error?.message || 'Unknown error'}`)
  }

  return { id: result.result.id, lead_no: result.result.lead_no }
}

// ── Update ─────────────────────────────────────────────────────────────────────

/**
 * Update any fields on an existing Vtiger record.
 * The element must include the record's `id` field.
 * Retrieve the full record first if you only want to update a few fields
 * (Vtiger's update replaces the whole element).
 */
export async function updateRecord(
  config: VtigerConfig,
  recordId: string,
  updates: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const sessionName = await getSession(config)
  const url = apiUrl(config.instance_url)

  // First retrieve the full record so we don't clobber existing fields
  const retrieveRes = await fetch(
    `${url}?operation=retrieve&sessionName=${encodeURIComponent(sessionName)}&id=${encodeURIComponent(recordId)}`
  )
  const retrieveData = await retrieveRes.json() as {
    success: boolean
    result?: Record<string, unknown>
    error?: { message: string }
  }

  if (!retrieveData.success || !retrieveData.result) {
    throw new Error(`Vtiger retrieve error: ${retrieveData.error?.message || 'Record not found'}`)
  }

  // Merge updates into the full record
  const element = JSON.stringify({ ...retrieveData.result, ...updates })

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

  const updateData = await updateRes.json() as {
    success: boolean
    result?: Record<string, unknown>
    error?: { message: string }
  }

  if (!updateData.success || !updateData.result) {
    throw new Error(`Vtiger update error: ${updateData.error?.message || 'Unknown error'}`)
  }

  return updateData.result
}

// ── Add Note / Comment ─────────────────────────────────────────────────────────

/**
 * Add a comment/note to any Vtiger record (Lead, Contact, etc.)
 * Uses the ModComments module which is available on all entities.
 */
export async function addNote(
  config: VtigerConfig,
  recordId: string,   // e.g. "4x123" (the full Vtiger ID including module prefix)
  noteText: string
): Promise<{ id: string }> {
  const sessionName = await getSession(config)
  const url = apiUrl(config.instance_url)

  const element = JSON.stringify({
    commentcontent: noteText,
    related_to: recordId,
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

  const result = await res.json() as {
    success: boolean
    result?: { id: string }
    error?: { message: string }
  }

  if (!result.success || !result.result?.id) {
    throw new Error(`Vtiger addNote error: ${result.error?.message || 'Unknown error'}`)
  }

  return { id: result.result.id }
}

// ── Test connection ────────────────────────────────────────────────────────────

/**
 * Verify credentials by attempting to get a session.
 * Returns true if successful, throws with a descriptive message if not.
 */
export async function testConnection(config: VtigerConfig): Promise<{ success: true; username: string }> {
  await getSession(config)   // throws on failure
  return { success: true, username: config.username }
}
