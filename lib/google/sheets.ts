import { google } from 'googleapis'
import fs from 'node:fs/promises'

type ServiceAccountCreds = {
  client_email: string
  private_key: string
}

function tryParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

async function loadServiceAccountCreds(): Promise<ServiceAccountCreds | null> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim()
  const keyEnv = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const privateKeyEnv = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

  // Option A: email + private key directly (recommended on hosting platforms)
  if (email && privateKeyEnv && privateKeyEnv.trim()) {
    return {
      client_email: email,
      private_key: privateKeyEnv.replace(/\\n/g, '\n'),
    }
  }

  // Option B: a JSON key passed as env or as a file path
  if (keyEnv && keyEnv.trim()) {
    const raw = keyEnv.trim()

    // 1) raw JSON
    const parsed = tryParseJson<ServiceAccountCreds>(raw)
    if (parsed?.client_email && parsed?.private_key) {
      return {
        client_email: parsed.client_email,
        private_key: String(parsed.private_key).replace(/\\n/g, '\n'),
      }
    }

    // 2) file path to JSON
    try {
      const file = await fs.readFile(raw, 'utf8')
      const fromFile = tryParseJson<ServiceAccountCreds>(file)
      if (fromFile?.client_email && fromFile?.private_key) {
        return {
          client_email: fromFile.client_email,
          private_key: String(fromFile.private_key).replace(/\\n/g, '\n'),
        }
      }
    } catch {
      // ignore; handled below
    }

    // 3) base64 JSON (optional convenience)
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8')
      const fromB64 = tryParseJson<ServiceAccountCreds>(decoded)
      if (fromB64?.client_email && fromB64?.private_key) {
        return {
          client_email: fromB64.client_email,
          private_key: String(fromB64.private_key).replace(/\\n/g, '\n'),
        }
      }
    } catch {
      // ignore
    }
  }

  return null
}

export function extractSpreadsheetId(url: string): string | null {
  const match = (url || '').match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

export function extractGidFromLink(link: string, key: string): string | null {
  const re = new RegExp(`[#&]${key}=(\\\\d+)`)
  const m = (link || '').match(re)
  return m ? m[1] : null
}

export async function getSheetsAuthedClient() {
  const creds = await loadServiceAccountCreds()
  if (!creds) {
    return { sheets: null as any, sheetAuthConfigured: false as const }
  }

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const sheets = google.sheets({ version: 'v4', auth })
  return { sheets, sheetAuthConfigured: true as const }
}

export async function resolveSheetTitleById(params: {
  spreadsheetId: string
  sheetId: number
}): Promise<{ title: string } | null> {
  const { spreadsheetId, sheetId } = params

  const { sheets, sheetAuthConfigured } = await getSheetsAuthedClient()
  if (!sheetAuthConfigured) return null

  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties(sheetId,title))',
  })

  const found = meta.data.sheets?.find((s) => s.properties?.sheetId === sheetId)
  const title = found?.properties?.title
  return title ? { title } : null
}


