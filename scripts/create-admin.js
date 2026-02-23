#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// create-admin.js — Bootstrap the first admin (marketer) user
//
// Usage:
//   node scripts/create-admin.js <email> <password>
//
// Example:
//   node scripts/create-admin.js johan@example.com MySecurePassword123
//
// The created user will have role: 'admin' in user_metadata, giving them
// full access to all clients and the Chat interface in the dashboard.
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cfkovdyvmbnnyzihqanp.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.')
  console.error('Set it in your .env.local file or pass it inline:')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/create-admin.js <email> <password>')
  process.exit(1)
}

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password>')
    console.error('Example: node scripts/create-admin.js admin@example.com MyPassword123')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters')
    process.exit(1)
  }

  console.log(`Creating admin user: ${email}...`)

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
      email_confirm: true, // Skip email confirmation — admin bootstrap
      user_metadata: {
        role: 'admin',
      },
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Failed to create admin user:')
    console.error(JSON.stringify(data, null, 2))
    process.exit(1)
  }

  console.log('✅ Admin user created successfully!')
  console.log(`   ID:    ${data.id}`)
  console.log(`   Email: ${data.email}`)
  console.log(`   Role:  ${data.user_metadata?.role}`)
  console.log('')
  console.log('You can now sign in at: http://localhost:3001/login')
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
