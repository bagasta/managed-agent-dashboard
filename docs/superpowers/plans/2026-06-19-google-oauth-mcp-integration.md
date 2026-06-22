# Google OAuth MCP Tool Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambah fitur create agent manual di dashboard Clevio, dengan kemampuan connect ke Google Workspace MCP tools (Gmail, Drive, Calendar, Sheets, Forms) menggunakan OAuth 2.0 per-agent, dan user bisa revoke akses kapan saja.

**Architecture:** Backend Fastify (TypeScript) menjadi OAuth server yang menyimpan token per agent di PostgreSQL via Prisma. Frontend React memanggil backend untuk initiate OAuth flow, menampilkan status koneksi per service, dan memberikan tombol revoke. Token refresh dilakukan otomatis oleh backend sebelum expired.

**Tech Stack:** Fastify 5, TypeScript, Prisma, PostgreSQL, React 18, React Router v6, Tailwind CSS, Vite, `@fastify/oauth2`, `@fastify/cors`, `@fastify/cookie`, `googleapis`

## Global Constraints

- TypeScript strict mode di semua file backend dan frontend
- Semua Google OAuth scope yang dipakai harus kategori **Sensitive** (bukan Restricted) untuk mempercepat verifikasi: `gmail.send`, `drive.file`, `calendar.events`, `spreadsheets`, `forms.body.readonly`
- Token disimpan terenkripsi di DB (kolom `accessToken` dan `refreshToken` dienkripsi dengan AES-256)
- Semua HTTP endpoint backend wajib HTTPS di production
- CORS hanya izinkan origin frontend yang terdaftar
- Setiap agent memiliki token OAuth terpisah (tidak shared antar agent)
- Backend port: `3001`, Frontend port: `5173`

---

## File Structure

### Backend (`/home/bagas/backend-managed-agents/`)

```
backend-managed-agents/
├── src/
│   ├── index.ts                    # Entry point, register plugins & routes
│   ├── config/
│   │   ├── env.ts                  # Env var validation (dotenv + zod)
│   │   └── mcp-tools.ts            # MCP tool → scope mapping config
│   ├── routes/
│   │   ├── agents.ts               # CRUD agent endpoints
│   │   └── oauth.ts                # OAuth start/callback/revoke endpoints
│   ├── services/
│   │   ├── agent.service.ts        # Business logic agent
│   │   ├── oauth.service.ts        # Google OAuth token management
│   │   └── crypto.service.ts       # AES-256 encrypt/decrypt token
│   └── plugins/
│       └── prisma.ts               # Prisma plugin untuk Fastify
├── prisma/
│   └── schema.prisma               # DB schema: Agent, OAuthToken
├── .env.example
├── package.json
└── tsconfig.json
```

### Frontend (`/home/bagas/frontend-managed-agents/src/`)

```
src/
├── api/
│   ├── client.ts                   # UPDATE: tambah base URL config
│   ├── agents.ts                   # CREATE: agent API calls
│   └── oauth.ts                    # CREATE: OAuth connect/revoke API calls
├── components/
│   ├── Layout.tsx                  # existing
│   ├── CreateAgentModal.tsx        # CREATE: form buat agent manual
│   └── McpToolSelector.tsx         # CREATE: checklist MCP tools + scope preview
├── pages/
│   ├── Agents.tsx                  # UPDATE: tambah button + modal create manual
│   └── AgentDetail.tsx             # UPDATE: tambah section Connected Services
└── types.ts                        # UPDATE: Agent, OAuthConnection, McpTool types
```

---

## Task 1: Backend Project Setup (Fastify + TypeScript + Prisma)

**Files:**
- Create: `backend-managed-agents/package.json`
- Create: `backend-managed-agents/tsconfig.json`
- Create: `backend-managed-agents/.env.example`
- Create: `backend-managed-agents/prisma/schema.prisma`
- Create: `backend-managed-agents/src/index.ts`
- Create: `backend-managed-agents/src/plugins/prisma.ts`
- Create: `backend-managed-agents/src/config/env.ts`

**Interfaces:**
- Produces: Fastify server instance, Prisma client, env config object

- [ ] **Step 1: Init project**

```bash
mkdir -p /home/bagas/backend-managed-agents
cd /home/bagas/backend-managed-agents
npm init -y
npm install fastify @fastify/cors @fastify/cookie @prisma/client zod fastify-plugin
npm install -D typescript @types/node ts-node-dev prisma
npx tsc --init
npx prisma init
```

- [ ] **Step 2: Tulis `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Tulis `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Agent {
  id          String       @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  oauthTokens OAuthToken[]
}

model OAuthToken {
  id            String   @id @default(cuid())
  agentId       String
  service       String   // "gmail" | "drive" | "calendar" | "sheets" | "forms"
  scopes        String[] // scope yang diizinkan
  accessToken   String   // encrypted AES-256
  refreshToken  String?  // encrypted AES-256
  expiresAt     DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  agent         Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)

  @@unique([agentId, service])
}
```

- [ ] **Step 4: Tulis `.env.example`**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/clevio_agents"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/oauth/google/callback"
TOKEN_ENCRYPTION_KEY="32-char-random-secret-key-here!!"
FRONTEND_URL="http://localhost:5173"
PORT=3001
```

- [ ] **Step 5: Tulis `src/config/env.ts`**

```typescript
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),
  TOKEN_ENCRYPTION_KEY: z.string().length(32),
  FRONTEND_URL: z.string().url(),
  PORT: z.coerce.number().default(3001),
})

export const env = envSchema.parse(process.env)
```

- [ ] **Step 6: Tulis `src/plugins/prisma.ts`**

```typescript
import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prismaPlugin: FastifyPluginAsync = fp(async (server) => {
  const prisma = new PrismaClient()
  await prisma.$connect()
  server.decorate('prisma', prisma)
  server.addHook('onClose', async (server) => {
    await server.prisma.$disconnect()
  })
})

export default prismaPlugin

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}
```

- [ ] **Step 7: Tulis `src/index.ts`**

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { env } from './config/env'
import prismaPlugin from './plugins/prisma'

const server = Fastify({ logger: true })

async function main() {
  await server.register(cors, { origin: env.FRONTEND_URL, credentials: true })
  await server.register(cookie)
  await server.register(prismaPlugin)

  server.get('/health', async () => ({ status: 'ok' }))

  await server.listen({ port: env.PORT, host: '0.0.0.0' })
}

main().catch((err) => {
  server.log.error(err)
  process.exit(1)
})
```

- [ ] **Step 8: Run migrasi DB**

```bash
# Pastikan PostgreSQL running dan .env sudah diisi
cp .env.example .env
# Edit .env dengan credentials DB yang benar
npx prisma migrate dev --name init
```

- [ ] **Step 9: Verifikasi server berjalan**

```bash
npx ts-node-dev src/index.ts
# Di terminal lain:
curl http://localhost:3001/health
# Expected: {"status":"ok"}
```

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "feat: init fastify backend with prisma schema"
```

---

## Task 2: Crypto Service + MCP Tools Config

**Files:**
- Create: `src/services/crypto.service.ts`
- Create: `src/config/mcp-tools.ts`

**Interfaces:**
- Produces:
  - `encrypt(text: string): string`
  - `decrypt(text: string): string`
  - `MCP_TOOLS: McpToolConfig[]`
  - `type McpToolConfig = { id: string; name: string; service: string; description: string; scopes: string[]; category: 'sensitive' | 'non-sensitive' }`

- [ ] **Step 1: Tulis `src/services/crypto.service.ts`**

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { env } from '../config/env'

const ALGORITHM = 'aes-256-cbc'
const KEY = Buffer.from(env.TOKEN_ENCRYPTION_KEY, 'utf8')

export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(encryptedText: string): string {
  const [ivHex, encryptedHex] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
```

- [ ] **Step 2: Tulis `src/config/mcp-tools.ts`**

```typescript
export type McpToolConfig = {
  id: string
  name: string
  service: string
  description: string
  scopes: string[]
  category: 'sensitive' | 'non-sensitive'
}

export const MCP_TOOLS: McpToolConfig[] = [
  {
    id: 'gmail-send',
    name: 'Gmail (Send)',
    service: 'gmail',
    description: 'Kirim email melalui Gmail',
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    category: 'sensitive',
  },
  {
    id: 'drive-file',
    name: 'Google Drive',
    service: 'drive',
    description: 'Buat dan akses file Drive yang dibuat oleh agent',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    category: 'sensitive',
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    service: 'calendar',
    description: 'Buat dan kelola events di Calendar',
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    category: 'sensitive',
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    service: 'sheets',
    description: 'Baca dan tulis data ke Google Sheets',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    category: 'sensitive',
  },
  {
    id: 'forms',
    name: 'Google Forms',
    service: 'forms',
    description: 'Baca struktur Google Forms',
    scopes: ['https://www.googleapis.com/auth/forms.body.readonly'],
    category: 'sensitive',
  },
]
```

- [ ] **Step 3: Test manual encrypt/decrypt**

```bash
npx ts-node -e "
const { encrypt, decrypt } = require('./src/services/crypto.service')
const enc = encrypt('test-token-123')
console.log('encrypted:', enc)
console.log('decrypted:', decrypt(enc))
// Expected: decrypted: test-token-123
"
```

- [ ] **Step 4: Commit**

```bash
git add src/services/crypto.service.ts src/config/mcp-tools.ts
git commit -m "feat: add crypto service and MCP tools config"
```

---

## Task 3: Agent Service + Routes (CRUD)

**Files:**
- Create: `src/services/agent.service.ts`
- Create: `src/routes/agents.ts`
- Modify: `src/index.ts` (register route)

**Interfaces:**
- Consumes: `server.prisma` (dari Task 1)
- Produces:
  - `GET /agents` → `Agent[]`
  - `POST /agents` → `Agent`
  - `GET /agents/:id` → `Agent & { oauthTokens: OAuthToken[] }`
  - `DELETE /agents/:id` → `{ success: true }`

- [ ] **Step 1: Tulis `src/services/agent.service.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

export class AgentService {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.agent.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async findById(id: string) {
    return this.prisma.agent.findUnique({
      where: { id },
      include: {
        oauthTokens: {
          select: { id: true, service: true, scopes: true, expiresAt: true, createdAt: true }
        }
      }
    })
  }

  async create(data: { name: string; description?: string }) {
    return this.prisma.agent.create({ data })
  }

  async delete(id: string) {
    await this.prisma.agent.delete({ where: { id } })
    return { success: true }
  }
}
```

- [ ] **Step 2: Tulis `src/routes/agents.ts`**

```typescript
import { FastifyInstance } from 'fastify'
import { AgentService } from '../services/agent.service'
import { z } from 'zod'

const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export async function agentRoutes(server: FastifyInstance) {
  const svc = new AgentService(server.prisma)

  server.get('/agents', async () => svc.findAll())

  server.get<{ Params: { id: string } }>('/agents/:id', async (req, reply) => {
    const agent = await svc.findById(req.params.id)
    if (!agent) return reply.status(404).send({ error: 'Agent not found' })
    return agent
  })

  server.post('/agents', async (req, reply) => {
    const body = createAgentSchema.parse(req.body)
    const agent = await svc.create(body)
    return reply.status(201).send(agent)
  })

  server.delete<{ Params: { id: string } }>('/agents/:id', async (req, reply) => {
    const agent = await svc.findById(req.params.id)
    if (!agent) return reply.status(404).send({ error: 'Agent not found' })
    return svc.delete(req.params.id)
  })
}
```

- [ ] **Step 3: Register route di `src/index.ts`**

Tambah dua baris berikut setelah register plugins, sebelum `listen`:

```typescript
import { agentRoutes } from './routes/agents'
// ...
await server.register(agentRoutes)
```

- [ ] **Step 4: Test endpoints**

```bash
# Buat agent
curl -X POST http://localhost:3001/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Agent","description":"Agent pertama"}'
# Expected: {"id":"...","name":"Test Agent","description":"Agent pertama",...}

# List agents
curl http://localhost:3001/agents
# Expected: [{"id":"...","name":"Test Agent",...}]
```

- [ ] **Step 5: Commit**

```bash
git add src/services/agent.service.ts src/routes/agents.ts src/index.ts
git commit -m "feat: add agent CRUD routes"
```

---

## Task 4: OAuth Service + Routes (Connect, Callback, Revoke)

**Files:**
- Create: `src/services/oauth.service.ts`
- Create: `src/routes/oauth.ts`
- Modify: `src/index.ts` (register route)

**Interfaces:**
- Consumes: `encrypt/decrypt` (Task 2), `server.prisma` (Task 1), `MCP_TOOLS` (Task 2)
- Produces:
  - `GET /oauth/google/start?agentId=&tools=gmail-send,drive-file` → redirect ke Google
  - `GET /oauth/google/callback?code=&state=` → redirect ke frontend
  - `DELETE /oauth/google/revoke/:agentId/:service` → `{ success: true }`
  - `GET /agents/:id/connections` → `{ service, scopes, createdAt, expiresAt }[]`

- [ ] **Step 1: Install googleapis**

```bash
npm install googleapis
```

- [ ] **Step 2: Tulis `src/services/oauth.service.ts`**

```typescript
import { google } from 'googleapis'
import { PrismaClient } from '@prisma/client'
import { env } from '../config/env'
import { MCP_TOOLS } from '../config/mcp-tools'
import { encrypt, decrypt } from './crypto.service'

export class OAuthService {
  constructor(private prisma: PrismaClient) {}

  private createOAuth2Client() {
    return new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    )
  }

  generateAuthUrl(agentId: string, toolIds: string[]): string {
    const scopes = toolIds.flatMap(
      (id) => MCP_TOOLS.find((t) => t.id === id)?.scopes ?? []
    )
    const uniqueScopes = [...new Set(scopes)]
    const state = Buffer.from(JSON.stringify({ agentId, toolIds })).toString('base64')

    const oauth2Client = this.createOAuth2Client()
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: uniqueScopes,
      state,
    })
  }

  async handleCallback(code: string, state: string) {
    const { agentId, toolIds } = JSON.parse(Buffer.from(state, 'base64').toString('utf8'))
    const oauth2Client = this.createOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)

    // Kelompokkan scopes per service
    const serviceMap = new Map<string, string[]>()
    for (const toolId of toolIds) {
      const tool = MCP_TOOLS.find((t) => t.id === toolId)
      if (!tool) continue
      const existing = serviceMap.get(tool.service) ?? []
      serviceMap.set(tool.service, [...existing, ...tool.scopes])
    }

    for (const [service, scopes] of serviceMap) {
      await this.prisma.oAuthToken.upsert({
        where: { agentId_service: { agentId, service } },
        create: {
          agentId,
          service,
          scopes,
          accessToken: encrypt(tokens.access_token!),
          refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
          expiresAt: new Date(tokens.expiry_date!),
        },
        update: {
          scopes,
          accessToken: encrypt(tokens.access_token!),
          refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
          expiresAt: new Date(tokens.expiry_date!),
        },
      })
    }

    return agentId
  }

  async revokeToken(agentId: string, service: string) {
    const token = await this.prisma.oAuthToken.findUnique({
      where: { agentId_service: { agentId, service } }
    })
    if (!token) return

    const oauth2Client = this.createOAuth2Client()
    try {
      await oauth2Client.revokeToken(decrypt(token.accessToken))
    } catch (_) {
      // Token mungkin sudah expired, tetap hapus dari DB
    }

    await this.prisma.oAuthToken.delete({
      where: { agentId_service: { agentId, service } }
    })
  }

  async getConnections(agentId: string) {
    return this.prisma.oAuthToken.findMany({
      where: { agentId },
      select: { service: true, scopes: true, createdAt: true, expiresAt: true }
    })
  }
}
```

- [ ] **Step 3: Tulis `src/routes/oauth.ts`**

```typescript
import { FastifyInstance } from 'fastify'
import { OAuthService } from '../services/oauth.service'
import { env } from '../config/env'

export async function oauthRoutes(server: FastifyInstance) {
  const svc = new OAuthService(server.prisma)

  server.get<{ Querystring: { agentId: string; tools: string } }>(
    '/oauth/google/start',
    async (req, reply) => {
      const { agentId, tools } = req.query
      if (!agentId || !tools) return reply.status(400).send({ error: 'agentId and tools required' })
      const toolIds = tools.split(',').filter(Boolean)
      const authUrl = svc.generateAuthUrl(agentId, toolIds)
      return reply.redirect(authUrl)
    }
  )

  server.get<{ Querystring: { code: string; state: string; error?: string } }>(
    '/oauth/google/callback',
    async (req, reply) => {
      const { code, state, error } = req.query
      if (error) return reply.redirect(`${env.FRONTEND_URL}/agents?oauth_error=${error}`)
      const agentId = await svc.handleCallback(code, state)
      return reply.redirect(`${env.FRONTEND_URL}/agents/${agentId}?oauth_success=true`)
    }
  )

  server.delete<{ Params: { agentId: string; service: string } }>(
    '/oauth/google/revoke/:agentId/:service',
    async (req) => {
      await svc.revokeToken(req.params.agentId, req.params.service)
      return { success: true }
    }
  )

  server.get<{ Params: { id: string } }>(
    '/agents/:id/connections',
    async (req) => svc.getConnections(req.params.id)
  )
}
```

- [ ] **Step 4: Register route di `src/index.ts`**

```typescript
import { oauthRoutes } from './routes/oauth'
// Tambah setelah agentRoutes:
await server.register(oauthRoutes)
```

- [ ] **Step 5: Test flow (gunakan browser)**

```
1. Buka: http://localhost:3001/oauth/google/start?agentId=<id-agent>&tools=gmail-send,drive-file
2. Harus redirect ke halaman consent Google
3. Setelah consent, harus redirect ke http://localhost:5173/agents/<id>?oauth_success=true
4. Cek DB: SELECT * FROM "OAuthToken" WHERE "agentId" = '<id>';
```

- [ ] **Step 6: Test revoke**

```bash
curl -X DELETE http://localhost:3001/oauth/google/revoke/<agentId>/gmail
# Expected: {"success":true}
```

- [ ] **Step 7: Commit**

```bash
git add src/services/oauth.service.ts src/routes/oauth.ts src/index.ts
git commit -m "feat: add google oauth connect/callback/revoke routes"
```

---

## Task 5: Frontend — Types + API Client Update

**Files:**
- Modify: `src/types.ts`
- Create: `src/api/agents.ts`
- Create: `src/api/oauth.ts`
- Modify: `src/api/client.ts`

**Interfaces:**
- Produces:
  - `type Agent`, `type OAuthConnection`, `type McpTool`, `const MCP_TOOLS`
  - `agentApi.list()`, `agentApi.create()`, `agentApi.get()`, `agentApi.delete()`, `agentApi.getConnections()`
  - `oauthApi.startConnect()`, `oauthApi.revoke()`

- [ ] **Step 1: Baca `src/types.ts` existing sebelum edit**

```bash
cat /home/bagas/frontend-managed-agents/src/types.ts
```

- [ ] **Step 2: Tambah types baru di `src/types.ts`**

Append di bawah types yang sudah ada:

```typescript
export type Agent = {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export type OAuthConnection = {
  service: string
  scopes: string[]
  createdAt: string
  expiresAt: string
}

export type McpTool = {
  id: string
  name: string
  service: string
  description: string
  scopes: string[]
  category: 'sensitive' | 'non-sensitive'
}

export const MCP_TOOLS: McpTool[] = [
  {
    id: 'gmail-send',
    name: 'Gmail (Send)',
    service: 'gmail',
    description: 'Kirim email melalui Gmail',
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    category: 'sensitive',
  },
  {
    id: 'drive-file',
    name: 'Google Drive',
    service: 'drive',
    description: 'Buat dan akses file Drive yang dibuat oleh agent',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    category: 'sensitive',
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    service: 'calendar',
    description: 'Buat dan kelola events di Calendar',
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    category: 'sensitive',
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    service: 'sheets',
    description: 'Baca dan tulis data ke Google Sheets',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    category: 'sensitive',
  },
  {
    id: 'forms',
    name: 'Google Forms',
    service: 'forms',
    description: 'Baca struktur Google Forms',
    scopes: ['https://www.googleapis.com/auth/forms.body.readonly'],
    category: 'sensitive',
  },
]
```

- [ ] **Step 3: Update `src/api/client.ts`**

```typescript
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}
```

- [ ] **Step 4: Buat `src/api/agents.ts`**

```typescript
import { apiFetch } from './client'
import { Agent, OAuthConnection } from '../types'

export const agentApi = {
  list: () => apiFetch<Agent[]>('/agents'),

  get: (id: string) =>
    apiFetch<Agent & { oauthTokens: OAuthConnection[] }>(`/agents/${id}`),

  create: (data: { name: string; description?: string }) =>
    apiFetch<Agent>('/agents', { method: 'POST', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ success: true }>(`/agents/${id}`, { method: 'DELETE' }),

  getConnections: (id: string) =>
    apiFetch<OAuthConnection[]>(`/agents/${id}/connections`),
}
```

- [ ] **Step 5: Buat `src/api/oauth.ts`**

```typescript
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const oauthApi = {
  startConnect: (agentId: string, toolIds: string[]) => {
    const tools = toolIds.join(',')
    window.location.href = `${BASE_URL}/oauth/google/start?agentId=${agentId}&tools=${tools}`
  },

  revoke: async (agentId: string, service: string): Promise<void> => {
    await fetch(`${BASE_URL}/oauth/google/revoke/${agentId}/${service}`, {
      method: 'DELETE',
      credentials: 'include',
    })
  },
}
```

- [ ] **Step 6: Tambah `.env` di frontend**

```bash
echo "VITE_API_URL=http://localhost:3001" >> /home/bagas/frontend-managed-agents/.env
```

- [ ] **Step 7: Commit**

```bash
cd /home/bagas/frontend-managed-agents
git add src/types.ts src/api/
git commit -m "feat: add agent & oauth API client"
```

---

## Task 6: Frontend — McpToolSelector Component

**Files:**
- Create: `src/components/McpToolSelector.tsx`

**Interfaces:**
- Consumes: `MCP_TOOLS: McpTool[]` dari `../types`
- Produces: `<McpToolSelector selected={string[]} onChange={(ids: string[]) => void} />`

- [ ] **Step 1: Tulis `src/components/McpToolSelector.tsx`**

```tsx
import { MCP_TOOLS, McpTool } from '../types'

type Props = {
  selected: string[]
  onChange: (ids: string[]) => void
}

export function McpToolSelector({ selected, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  const selectedScopes = [...new Set(
    selected.flatMap((id) => MCP_TOOLS.find((t) => t.id === id)?.scopes ?? [])
  )]

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Pilih MCP Tools</p>
      <div className="grid grid-cols-1 gap-2">
        {MCP_TOOLS.map((tool: McpTool) => (
          <label
            key={tool.id}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              selected.includes(tool.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(tool.id)}
              onChange={() => toggle(tool.id)}
              className="mt-0.5 h-4 w-4 text-blue-600"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{tool.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                  {tool.category}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{tool.description}</p>
            </div>
          </label>
        ))}
      </div>

      {selectedScopes.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-600 mb-1">Scopes yang akan diminta:</p>
          <ul className="space-y-0.5">
            {selectedScopes.map((scope) => (
              <li key={scope} className="text-xs text-gray-500 font-mono truncate">
                • {scope}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/McpToolSelector.tsx
git commit -m "feat: add McpToolSelector component"
```

---

## Task 7: Frontend — CreateAgentModal Component

**Files:**
- Create: `src/components/CreateAgentModal.tsx`

**Interfaces:**
- Consumes: `McpToolSelector` (Task 6), `agentApi.create()` (Task 5), `type Agent` (Task 5)
- Produces: `<CreateAgentModal open={boolean} onClose={() => void} onCreated={(agent: Agent) => void} />`

- [ ] **Step 1: Tulis `src/components/CreateAgentModal.tsx`**

```tsx
import { useState } from 'react'
import { Agent } from '../types'
import { agentApi } from '../api/agents'
import { McpToolSelector } from './McpToolSelector'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (agent: Agent) => void
}

export function CreateAgentModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const agent = await agentApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onCreated(agent)
      setName('')
      setDescription('')
      setSelectedTools([])
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat agent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Buat Agent Baru</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Agent *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Email Scheduler Agent"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Apa yang dilakukan agent ini?"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <McpToolSelector selected={selectedTools} onChange={setSelectedTools} />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Membuat...' : 'Buat Agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CreateAgentModal.tsx
git commit -m "feat: add CreateAgentModal component"
```

---

## Task 8: Frontend — Update Agents.tsx + AgentDetail.tsx

**Files:**
- Modify: `src/pages/Agents.tsx`
- Modify: `src/pages/AgentDetail.tsx`

**Interfaces:**
- Consumes:
  - `CreateAgentModal` dari `../components/CreateAgentModal` (Task 7)
  - `agentApi` dari `../api/agents` (Task 5)
  - `oauthApi` dari `../api/oauth` (Task 5)
  - `type Agent`, `type OAuthConnection`, `MCP_TOOLS` dari `../types` (Task 5)

- [ ] **Step 1: Baca `src/pages/Agents.tsx` existing**

```bash
cat /home/bagas/frontend-managed-agents/src/pages/Agents.tsx
```

- [ ] **Step 2: Baca `src/pages/AgentDetail.tsx` existing**

```bash
cat /home/bagas/frontend-managed-agents/src/pages/AgentDetail.tsx
```

- [ ] **Step 3: Update `Agents.tsx`**

Tambah imports di atas:

```tsx
import { useState, useEffect } from 'react'
import { CreateAgentModal } from '../components/CreateAgentModal'
import { agentApi } from '../api/agents'
import { Agent } from '../types'
```

Tambah state dan handler di dalam komponen:

```tsx
const [agents, setAgents] = useState<Agent[]>([])
const [showCreate, setShowCreate] = useState(false)

useEffect(() => {
  agentApi.list().then(setAgents).catch(console.error)
}, [])

const handleCreated = (agent: Agent) => {
  setAgents((prev) => [agent, ...prev])
}
```

Tambah button dan modal di JSX (sesuaikan posisi dengan layout existing):

```tsx
{/* Tombol di header/toolbar section */}
<button
  onClick={() => setShowCreate(true)}
  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
>
  + Buat Agent Manual
</button>

{/* Modal di akhir JSX sebelum closing tag */}
<CreateAgentModal
  open={showCreate}
  onClose={() => setShowCreate(false)}
  onCreated={handleCreated}
/>
```

- [ ] **Step 4: Update `AgentDetail.tsx`**

Tambah imports:

```tsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { agentApi } from '../api/agents'
import { oauthApi } from '../api/oauth'
import { OAuthConnection, MCP_TOOLS } from '../types'
```

Tambah state di dalam komponen (sesuaikan `id` dengan cara existing mengambil params):

```tsx
const [searchParams] = useSearchParams()
const [connections, setConnections] = useState<OAuthConnection[]>([])
const [selectedTools, setSelectedTools] = useState<string[]>([])

useEffect(() => {
  if (!id) return
  agentApi.getConnections(id).then(setConnections).catch(console.error)
}, [id, searchParams.get('oauth_success')])

const handleConnect = () => {
  if (!id || selectedTools.length === 0) return
  oauthApi.startConnect(id, selectedTools)
}

const handleRevoke = async (service: string) => {
  if (!id) return
  await oauthApi.revoke(id, service)
  setConnections((prev) => prev.filter((c) => c.service !== service))
}
```

Tambah section UI Connected Services di JSX:

```tsx
<div className="mt-6 border-t pt-6">
  <h3 className="text-base font-semibold text-gray-900 mb-4">
    Google Workspace Connections
  </h3>

  {connections.length > 0 && (
    <div className="space-y-2 mb-4">
      {connections.map((conn) => (
        <div
          key={conn.service}
          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <div>
            <span className="text-sm font-medium text-green-800 capitalize">
              {conn.service}
            </span>
            <p className="text-xs text-green-600">{conn.scopes.length} scope aktif</p>
          </div>
          <button
            onClick={() => handleRevoke(conn.service)}
            className="text-xs text-red-600 hover:text-red-700 border border-red-200 rounded px-2 py-1"
          >
            Revoke
          </button>
        </div>
      ))}
    </div>
  )}

  <div className="border border-gray-200 rounded-lg p-4">
    <p className="text-sm font-medium text-gray-700 mb-3">Hubungkan Google Tools</p>
    <div className="space-y-2 mb-3">
      {MCP_TOOLS.filter((t) => !connections.find((c) => c.service === t.service)).map((tool) => (
        <label key={tool.id} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedTools.includes(tool.id)}
            onChange={() =>
              setSelectedTools((prev) =>
                prev.includes(tool.id)
                  ? prev.filter((x) => x !== tool.id)
                  : [...prev, tool.id]
              )
            }
            className="h-4 w-4 text-blue-600"
          />
          <span className="text-sm text-gray-700">{tool.name}</span>
        </label>
      ))}
    </div>
    <button
      onClick={handleConnect}
      disabled={selectedTools.length === 0}
      className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-40"
    >
      Connect dengan Google
    </button>
  </div>
</div>
```

- [ ] **Step 5: Test UI manual**

```
1. Buka http://localhost:5173/agents
2. Klik "+ Buat Agent Manual" → modal muncul dengan form + McpToolSelector
3. Isi nama, pilih tools, klik "Buat Agent" → agent muncul di list
4. Klik agent → halaman detail
5. Pilih tool belum terconnect → klik "Connect dengan Google"
6. Harus redirect ke Google consent screen
7. Setelah consent → kembali ke halaman detail dengan badge hijau "Connected"
8. Klik "Revoke" → badge hilang
```

- [ ] **Step 6: Build check (tidak boleh ada TypeScript error)**

```bash
cd /home/bagas/frontend-managed-agents
npm run build
# Expected: build sukses tanpa error
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/Agents.tsx src/pages/AgentDetail.tsx
git commit -m "feat: integrate create agent modal and google oauth connect/revoke UI"
```

---

## Validation (End-to-End)

```bash
# Terminal 1: Backend
cd /home/bagas/backend-managed-agents
npx ts-node-dev src/index.ts

# Terminal 2: Frontend
cd /home/bagas/frontend-managed-agents
npm run dev

# Cek health backend
curl http://localhost:3001/health
# Expected: {"status":"ok"}

# Frontend build (no TS errors)
cd /home/bagas/frontend-managed-agents && npm run build
```

---

## Risks

| Risk | Likelihood | Mitigasi |
|---|---|---|
| Google unverified app warning saat testing | Tinggi | Gunakan Testing mode, whitelist email di Google Cloud Console |
| `refresh_token` null setelah consent pertama | Medium | `prompt: 'consent'` dipaksa di auth URL |
| CORS error frontend ↔ backend | Medium | Pastikan `FRONTEND_URL` di backend `.env` sama persis dengan origin dev |
| Token encryption key bukan 32 char | Tinggi | Validasi di `env.ts` via zod `.length(32)` |
| Prisma migrate gagal | Rendah | Pastikan PostgreSQL running dan credentials benar |
| Route conflict `/agents/:id/connections` vs `/agents/:id` | Medium | Register `connections` route sebelum generic `:id` route |

---

## Acceptance Criteria

- [ ] Agent bisa dibuat manual dari halaman Agents tanpa Arthur
- [ ] Modal menampilkan MCP tool checklist dengan scope preview
- [ ] Klik Connect → redirect ke Google consent screen
- [ ] Setelah consent → token tersimpan di DB (terenkripsi AES-256)
- [ ] AgentDetail menampilkan services yang sudah terconnect dengan badge hijau
- [ ] Tombol Revoke menghapus token dari DB dan merevoke di Google
- [ ] Build TypeScript frontend dan backend tanpa error
- [ ] Tidak ada scope Restricted yang digunakan (semua Sensitive)
