import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const STAGING_PROJECT_REF = 'huzcvjyyyuudchnrosvx'
const STAGING_URL = `https://${STAGING_PROJECT_REF}.supabase.co`
const DEFAULT_OUTPUT_PATH = 'output/staging-validation-users.json'
const PROFILE_POLL_ATTEMPTS = 10
const PROFILE_POLL_DELAY_MS = 500

type ValidationUserSpec = {
  label: 'Admin1' | 'Host1' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5'
  emailEnvVar:
    | 'STAGING_ADMIN1_EMAIL'
    | 'STAGING_HOST1_EMAIL'
    | 'STAGING_P1_EMAIL'
    | 'STAGING_P2_EMAIL'
    | 'STAGING_P3_EMAIL'
    | 'STAGING_P4_EMAIL'
    | 'STAGING_P5_EMAIL'
  fullName: string
}

type ValidationUserResult = {
  label: ValidationUserSpec['label']
  email: string
  user_id: string | null
  profile_exists: boolean
  created_now: boolean
}

type ValidationUsersOutput = {
  project_ref: string
  supabase_url: string
  output_file: string
  generated_at: string
  summary: {
    total_requested: number
    created_count: number
    existing_count: number
    failed_count: number
  }
  users: ValidationUserResult[]
}

const VALIDATION_USERS: ValidationUserSpec[] = [
  { label: 'Admin1', emailEnvVar: 'STAGING_ADMIN1_EMAIL', fullName: 'Admin1' },
  { label: 'Host1', emailEnvVar: 'STAGING_HOST1_EMAIL', fullName: 'Host1' },
  { label: 'P1', emailEnvVar: 'STAGING_P1_EMAIL', fullName: 'P1' },
  { label: 'P2', emailEnvVar: 'STAGING_P2_EMAIL', fullName: 'P2' },
  { label: 'P3', emailEnvVar: 'STAGING_P3_EMAIL', fullName: 'P3' },
  { label: 'P4', emailEnvVar: 'STAGING_P4_EMAIL', fullName: 'P4' },
  { label: 'P5', emailEnvVar: 'STAGING_P5_EMAIL', fullName: 'P5' },
]

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function listAllAuthUsers(
  supabase: ReturnType<typeof createClient>,
): Promise<Array<{ id: string; email: string | null }>> {
  const users: Array<{ id: string; email: string | null }> = []
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`)
    }

    const pageUsers = data.users.map((user) => ({
      id: user.id,
      email: user.email ?? null,
    }))

    users.push(...pageUsers)

    if (pageUsers.length < 200) {
      return users
    }

    page += 1
  }
}

async function waitForProfileRow(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  for (let attempt = 1; attempt <= PROFILE_POLL_ATTEMPTS; attempt += 1) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to verify profile row for ${userId}: ${error.message}`)
    }

    if (data?.id === userId) {
      return true
    }

    await sleep(PROFILE_POLL_DELAY_MS)
  }

  return false
}

async function ensureOutputDirectory(outputFilePath: string): Promise<void> {
  await mkdir(path.dirname(outputFilePath), { recursive: true })
}

async function main(): Promise<void> {
  const projectRef = requireEnv('STAGING_PROJECT_REF')
  const supabaseUrl = requireEnv('STAGING_SUPABASE_URL')
  const serviceRoleKey = requireEnv('STAGING_SUPABASE_SERVICE_ROLE_KEY')
  const sharedPassword = requireEnv('STAGING_VALIDATION_SHARED_PASSWORD')
  const outputFile = path.resolve(
    process.cwd(),
    process.env.STAGING_VALIDATION_USERS_OUTPUT?.trim() || DEFAULT_OUTPUT_PATH,
  )

  if (projectRef !== STAGING_PROJECT_REF) {
    throw new Error(
      `Refusing to run: STAGING_PROJECT_REF must equal ${STAGING_PROJECT_REF}, received ${projectRef}`,
    )
  }

  if (supabaseUrl !== STAGING_URL) {
    throw new Error(
      `Refusing to run: STAGING_SUPABASE_URL must equal ${STAGING_URL}, received ${supabaseUrl}`,
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const existingUsers = await listAllAuthUsers(supabase)
  const existingUsersByEmail = new Map(
    existingUsers
      .filter((user) => user.email)
      .map((user) => [user.email!.toLowerCase(), user]),
  )

  const results: ValidationUserResult[] = []

  for (const userSpec of VALIDATION_USERS) {
    const email = requireEnv(userSpec.emailEnvVar).toLowerCase()
    const existingUser = existingUsersByEmail.get(email)

    let userId: string
    let createdNow = false

    if (existingUser) {
      userId = existingUser.id
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: sharedPassword,
        email_confirm: true,
        user_metadata: {
          full_name: userSpec.fullName,
          validation_label: userSpec.label,
        },
      })

      if (error || !data.user) {
        throw new Error(`Failed to create ${userSpec.label} (${email}): ${error?.message ?? 'unknown error'}`)
      }

      userId = data.user.id
      createdNow = true
    }

    const profileExists = await waitForProfileRow(supabase, userId)

    if (!profileExists) {
      throw new Error(`Auth user ${userSpec.label} (${userId}) exists but matching public.profiles row was not created`)
    }

    results.push({
      label: userSpec.label,
      email,
      user_id: userId,
      profile_exists: profileExists,
      created_now: createdNow,
    })
  }

  const output: ValidationUsersOutput = {
    project_ref: projectRef,
    supabase_url: supabaseUrl,
    output_file: outputFile,
    generated_at: new Date().toISOString(),
    summary: {
      total_requested: VALIDATION_USERS.length,
      created_count: results.filter((result) => result.created_now).length,
      existing_count: results.filter((result) => !result.created_now).length,
      failed_count: 0,
    },
    users: results,
  }

  await ensureOutputDirectory(outputFile)
  await writeFile(outputFile, JSON.stringify(output, null, 2) + '\n', 'utf8')
  process.stdout.write(JSON.stringify(output, null, 2) + '\n')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  const failureOutput = {
    project_ref: process.env.STAGING_PROJECT_REF ?? null,
    supabase_url: process.env.STAGING_SUPABASE_URL ?? null,
    generated_at: new Date().toISOString(),
    error: message,
  }

  process.stderr.write(JSON.stringify(failureOutput, null, 2) + '\n')
  process.exitCode = 1
})
