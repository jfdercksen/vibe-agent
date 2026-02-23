#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// create-client-user.js — Create a client user locked to one client
//
// Usage:
//   node scripts/create-client-user.js <email> <password> <client_id>
//
// Example:
//   node scripts/create-client-user.js client@ztechcomputer.co.za MyPassword123 6deddf14-545c-45cb-a0ca-6540a90377ad
//
// The created user will be locked to the specified client_id. They can only
// see their own company's dashboard and cannot access Chat or other clients.
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cfkovdyvmbnnyzihqanp.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.')
  console.error('Set it in your .env.local file or pass it inline:')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/create-client-user.js <email> <password> <client_id>')
  process.exit(1)
}

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]
  const clientId = process.argv[4]

  if (!email || !password || !clientId) {
    console.error('Usage: node scripts/create-client-user.js <email> <password> <client_id>')
    console.error('')
    console.error('To find the client_id, check the Supabase dashboard or run:')
    console.error('  node scripts/list-clients.js')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters')
    process.exit(1)
  }

  // Validate the client_id exists before creating the user
  const checkResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/clients?id=eq.${clientId}&select=id,name,display_name`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  )
  const clients = await checkResponse.json()

  if (!Array.isArray(clients) || clients.length === 0) {
    console.error(`No client found with ID: ${clientId}`)
    console.error('Check the client_id is correct.')
    process.exit(1)
  }

  const clientName = clients[0].display_name || clients[0].name
  console.log(`Creating client user for: ${clientName}`)
  console.log(`  Email: ${email}`)
  console.log(`  Client: ${clientName} (${clientId})`)
  console.log('')

  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        role: 'client',
        client_id: clientId,
      },
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Failed to create client user:')
    console.error(JSON.stringify(data, null, 2))
    process.exit(1)
  }

  console.log('✅ Client user created successfully!')
  console.log(`   ID:        ${data.id}`)
  console.log(`   Email:     ${data.email}`)
  console.log(`   Role:      ${data.user_metadata?.role}`)
  console.log(`   Client:    ${clientName}`)
  console.log(`   Client ID: ${data.user_metadata?.client_id}`)
  console.log('')
  console.log(`Share these login details with ${clientName}:`)
  console.log(`  URL:      http://localhost:3001/login`)
  console.log(`  Email:    ${email}`)
  console.log(`  Password: ${password}`)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
