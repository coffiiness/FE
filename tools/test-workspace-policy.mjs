// Node built-ins + existing Axios only. No application server or Google calls.
// node --experimental-vm-modules --test tools/test-workspace-policy.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve, dirname, isAbsolute } from 'node:path'
import vm from 'node:vm'
import axios from 'axios'

class MemoryStorage {
  data = new Map()
  getItem(key) { return this.data.get(key) ?? null }
  setItem(key, value) { this.data.set(key, String(value)) }
  removeItem(key) { this.data.delete(key) }
}

async function harness(overrides = {}) {
  const mounted = []
  const navigations = []
  const route = { query: {}, params: { token: 'mock-invitation' }, fullPath: '/mock', ...overrides.route }
  const router = { push: (target) => navigations.push(target), replace: (target) => navigations.push(target), back() {}, beforeEach(fn) { this.guard = fn } }
  const context = vm.createContext({
    localStorage: new MemoryStorage(), sessionStorage: new MemoryStorage(),
    window: { location: { origin: 'https://calfit.co.kr' } },
    console, URL, Date, setTimeout: () => {},
  })
  context.localStorage.setItem('user', JSON.stringify({ id: 3, role: 'MEMBER' }))
  context.localStorage.setItem('accessToken', 'synthetic-token')
  context.localStorage.setItem('workspaceId', 'workspace-a')
  const workspaceApi = overrides.workspaceApi || { getMyWorkspace: async () => ({ data: { data: { workspaceId: 'workspace-a' } } }) }
  const modules = new Map()
  const stubs = {
    axios: { default: axios },
    '@/router': { default: router },
    vue: { ref: (value) => ({ value }), onMounted: (fn) => mounted.push(fn) },
    'vue-router': { useRoute: () => route, useRouter: () => router, createRouter: () => router, createWebHistory: () => ({}) },
    '@/api/workspace': { workspaceApi },
    '@/api/invitation': { invitationApi: overrides.invitationApi || {} },
    ...(overrides.googleCalendarApi ? { '@/api/googleCalendar': { googleCalendarApi: overrides.googleCalendarApi } } : {}),
  }
  async function load(id, parent = process.cwd(), exports = []) {
    if (stubs[id] || id.endsWith('.vue') && !isAbsolute(id)) {
      const values = stubs[id] || { default: {} }
      const key = `stub:${id}`
      if (!modules.has(key)) modules.set(key, new vm.SyntheticModule(Object.keys(values), function () {
        for (const [name, value] of Object.entries(values)) this.setExport(name, value)
      }, { context }))
      return modules.get(key)
    }
    let file = id.startsWith('@/') ? resolve('src', id.slice(2)) : resolve(parent, id)
    if (!/\.(js|vue)$/.test(file)) file += '.js'
    if (modules.has(file)) return modules.get(file)
    let source = await readFile(file, 'utf8')
    if (file.endsWith('.vue')) source = source.match(/<script setup>([\s\S]*?)<\/script>/)[1]
    if (exports.length) source += `\nexport { ${exports.join(', ')} }`
    const module = new vm.SourceTextModule(source, { context, identifier: file,
      initializeImportMeta(meta) { meta.env = { VITE_API_BASE_URL: 'https://mock.invalid/api/v1' } } })
    modules.set(file, module)
    await module.link((specifier) => load(specifier, dirname(file)))
    return module
  }
  return { context, mounted, navigations, router, workspaceApi, async load(file, exports) {
    const module = await load(resolve(file), process.cwd(), exports)
    await module.evaluate()
    return module.namespace
  } }
}

test('400 never changes workspace or replays OAuth/create/accept requests', async () => {
  const h = await harness()
  const { default: api } = await h.load('src/api/index.js')
  const calls = []
  api.defaults.adapter = async (config) => {
    calls.push(config)
    throw new axios.AxiosError('mock 400', 'ERR_BAD_REQUEST', config, null, { status: 400, data: {}, config })
  }
  for (const path of ['/workspaces', '/invitations/mock/accept', '/calendars/google/connect']) {
    await assert.rejects(api.post(path, { code: 'synthetic-code' }))
  }
  assert.equal(calls.length, 3)
  assert.ok(calls.every((call) => call.method === 'post' && call.headers['X-Tenant-ID'] === 'workspace-a'))
  assert.equal(h.context.localStorage.getItem('workspaceId'), 'workspace-a')
  assert.equal(h.navigations.length, 0)
})

test('401 clears authentication, tenant and legacy calendar caches', async () => {
  const h = await harness()
  const { default: api } = await h.load('src/api/index.js')
  h.context.localStorage.setItem('isGoogleCalendarConnected', 'true')
  h.context.localStorage.setItem('googleCalendarEmail', 'synthetic@mock.invalid')
  h.context.sessionStorage.setItem('calfit.googleOAuthPending', 'old-state')
  api.defaults.adapter = async (config) => { throw new axios.AxiosError('mock 401', 'ERR_BAD_REQUEST', config, null, { status: 401, data: {}, config }) }
  await assert.rejects(api.get('/calendars/google/status'))
  for (const key of ['user', 'workspaceId', 'accessToken', 'isGoogleCalendarConnected', 'googleCalendarEmail']) assert.equal(h.context.localStorage.getItem(key), null)
  assert.equal(h.context.sessionStorage.getItem('calfit.googleOAuthPending'), null)
  assert.equal(h.navigations[0], '/login')
})

test('explicit self membership lookup omits stale tenant header without replaying anything', async () => {
  const h = await harness()
  const { default: api } = await h.load('src/api/index.js')
  const calls = []
  api.defaults.adapter = async (config) => {
    calls.push(config)
    return { status: 200, headers: {}, config, data: { data: { workspaceId: 'canonical' } } }
  }
  await api.get('/users/me/workspace')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].headers['X-Tenant-ID'], undefined)
  assert.equal(calls[0].headers.Authorization, 'Bearer synthetic-token')
  assert.equal(h.context.localStorage.getItem('workspaceId'), 'workspace-a')
  await api.get('/members')
  assert.equal(calls[1].headers['X-Tenant-ID'], 'workspace-a')
})

test('one-time exchange memoizes success and failure without retry', async () => {
  const h = await harness()
  const { exchangeOAuthOnce, clearGoogleCalendarCache } = await h.load('src/utils/googleCalendarSession.js')
  let calls = 0
  const operation = async () => { calls++; return 'ok' }
  assert.equal(await exchangeOAuthOnce('state', operation), 'ok')
  assert.equal(await exchangeOAuthOnce('state', operation), 'ok')
  assert.equal(calls, 1)
  const failure = async () => { calls++; throw new Error('mock failure') }
  await assert.rejects(exchangeOAuthOnce('failed-state', failure))
  await assert.rejects(exchangeOAuthOnce('failed-state', failure))
  assert.equal(calls, 2)
  clearGoogleCalendarCache()
  await assert.rejects(exchangeOAuthOnce('', operation))
})

test('in-flight workspace lookups are account-scoped and discard stale login responses', async () => {
  const h = await harness()
  h.context.localStorage.removeItem('workspaceId')
  const { ensureWorkspaceId } = await h.load('src/utils/workspaceSession.js')
  const previousAdapter = axios.defaults.adapter
  const pending = new Map()
  axios.defaults.adapter = (config) => new Promise((resolveResponse) => {
    pending.set(config.headers.Authorization, (workspaceId) => resolveResponse({ status: 200, headers: {}, config, data: { data: { workspaceId } } }))
  })
  try {
    const first = ensureWorkspaceId('synthetic-token')
    h.context.localStorage.setItem('accessToken', 'second-token')
    const second = ensureWorkspaceId('second-token')
    pending.get('Bearer second-token')('workspace-b')
    assert.equal(await second, 'workspace-b')
    pending.get('Bearer synthetic-token')('workspace-a')
    assert.equal(await first, null)
    assert.equal(h.context.localStorage.getItem('workspaceId'), 'workspace-b')
  } finally { axios.defaults.adapter = previousAdapter }
})

test('authorization stores server-issued state bound to user and workspace', async () => {
  const h = await harness()
  const { googleCalendarApi } = await h.load('src/api/googleCalendar.js')
  const { default: api } = await h.load('src/api/index.js')
  api.defaults.adapter = async (config) => ({ status: 200, headers: {}, config, data: { data: { state: 'mock-state', authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?state=mock-state', expiresInSeconds: 300 } } })
  assert.match(await googleCalendarApi.beginAuthorization(), /^https:\/\/accounts.google.com\//)
  const pending = JSON.parse(h.context.sessionStorage.getItem('calfit.googleOAuthPending'))
  assert.equal(pending.userId, 3)
  assert.equal(pending.workspaceId, 'workspace-a')
  assert.equal(pending.state, 'mock-state')
  api.defaults.adapter = async (config) => {
    h.context.localStorage.setItem('workspaceId', 'changed')
    return { status: 200, headers: {}, config, data: { data: {} } }
  }
  await assert.rejects(googleCalendarApi.beginAuthorization(), /변경/)
})

test('callback rejects wrong/reused/expired state or changed user/tenant before code exchange', async () => {
  for (const changed of ['state', 'user', 'workspace', 'expired', 'missing']) {
    let exchanges = 0
    const h = await harness({ route: { query: { code: 'mock-code', state: changed === 'state' ? 'wrong' : 'mock-state' } }, googleCalendarApi: { connect: async () => { exchanges++ } } })
    if (changed !== 'missing') h.context.sessionStorage.setItem('calfit.googleOAuthPending', JSON.stringify({ state: 'mock-state', userId: changed === 'user' ? 4 : 3, workspaceId: changed === 'workspace' ? 'workspace-b' : 'workspace-a', expiresAt: Date.now() + (changed === 'expired' ? -1 : 300000) }))
    const view = await h.load('src/views/GoogleCallbackView.vue', ['isErrorModalOpen'])
    await h.mounted[0]()
    assert.equal(exchanges, 0, changed)
    assert.equal(view.isErrorModalOpen.value, true)
    assert.equal(h.context.sessionStorage.getItem('calfit.googleOAuthPending'), null)
  }
})

test('valid callback consumes pending cache and never sets legacy connection flags', async () => {
  let exchanges = 0
  const h = await harness({ route: { query: { code: 'mock-code', state: 'mock-state' } }, googleCalendarApi: { connect: async () => { exchanges++ } } })
  h.context.sessionStorage.setItem('calfit.googleOAuthPending', JSON.stringify({ state: 'mock-state', userId: 3, workspaceId: 'workspace-a', expiresAt: Date.now() + 300000 }))
  const view = await h.load('src/views/GoogleCallbackView.vue', ['isSuccessModalOpen', 'isErrorModalOpen'])
  await h.mounted[0]()
  assert.equal(exchanges, 1)
  assert.equal(view.isSuccessModalOpen.value, true)
  assert.equal(h.context.localStorage.getItem('isGoogleCalendarConnected'), null)
  await h.mounted[0]()
  assert.equal(exchanges, 1)
  assert.equal(view.isErrorModalOpen.value, true)
})

test('callback does not display another account connection after context changes during exchange', async () => {
  let h
  h = await harness({ route: { query: { code: 'mock-code', state: 'mock-state' } }, googleCalendarApi: { connect: async () => {
    h.context.localStorage.setItem('workspaceId', 'workspace-b')
  } } })
  h.context.sessionStorage.setItem('calfit.googleOAuthPending', JSON.stringify({ state: 'mock-state', userId: 3, workspaceId: 'workspace-a', expiresAt: Date.now() + 300000 }))
  const view = await h.load('src/views/GoogleCallbackView.vue', ['isSuccessModalOpen', 'isErrorModalOpen'])
  await h.mounted[0]()
  assert.equal(view.isSuccessModalOpen.value, false)
  assert.equal(view.isErrorModalOpen.value, true)
})

test('workspace create screen blocks current members and lookup errors', async () => {
  for (const lookupFails of [false, true]) {
    let creates = 0
    const h = await harness({ workspaceApi: {
      getMyWorkspace: async () => { if (lookupFails) throw new Error('mock lookup failure'); return { data: { data: { workspaceId: 'canonical-workspace' } } } },
      createWorkspace: async () => { creates++ },
    } })
    const view = await h.load('src/views/WorkspaceView.vue', ['canCreate', 'handleStart'])
    await h.mounted[0]()
    await view.handleStart()
    assert.equal(view.canCreate.value, false)
    assert.equal(creates, 0)
    if (!lookupFails) assert.equal(h.navigations[0], '/dashboard')
  }
})

test('unaffiliated user can create once and concurrent clicks do not replay', async () => {
  let creates = 0
  const h = await harness({ workspaceApi: {
    getMyWorkspace: async () => ({ data: { data: {} } }),
    createWorkspace: async () => { creates++; return { data: { data: { workspaceId: 'new-workspace' } } } },
  } })
  const view = await h.load('src/views/WorkspaceView.vue', ['handleStart'])
  await h.mounted[0]()
  await Promise.all([view.handleStart(), view.handleStart()])
  assert.equal(creates, 1)
  assert.equal(h.context.localStorage.getItem('workspaceId'), 'new-workspace')
})

test('invitation view blocks existing membership and shows backend conflict', async () => {
  for (const alreadyMember of [true, false]) {
    let accepts = 0
    const h = await harness({
      workspaceApi: { getMyWorkspace: async () => ({ data: { data: alreadyMember ? { workspaceId: 'existing' } : {} } }) },
      invitationApi: {
        getInvitation: async () => ({ data: { data: { workspaceName: 'Mock' } } }),
        acceptInvitation: async () => { accepts++; throw { response: { status: 409, data: { error: { customCode: 'ACTIVE_WORKSPACE_EXISTS' } } } } },
      },
    })
    const view = await h.load('src/views/InvitationAcceptView.vue', ['handleAccept', 'errorMessage'])
    await h.mounted[0]()
    await view.handleAccept()
    await view.handleAccept()
    assert.equal(accepts, alreadyMember ? 0 : 1)
    assert.match(view.errorMessage.value, /소속/)
  }
})
