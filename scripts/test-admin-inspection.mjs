import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { INSPECTION_MODULES, resolveInspectionSelection } = await server.ssrLoadModule('/src/data/adminInspection.js')
  const { default: Page } = await server.ssrLoadModule('/src/pages/AdminInspection.jsx')
  const { default: RequireAdmin } = await server.ssrLoadModule('/src/components/RequireAdmin.jsx')
  const { useAccessStore } = await server.ssrLoadModule('/src/store/accessStore.js')
  const denied = () => { throw new Error('Inspection must not access storage or network') }
  const originalFetch = globalThis.fetch
  globalThis.fetch = denied
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: denied, setItem: denied } })
  try {
    const fallback = resolveInspectionSelection(new URLSearchParams('module=unknown&lesson=unknown&section=unknown'))
    assert.equal(fallback.module.id, INSPECTION_MODULES[0].id)
    const before = JSON.stringify(INSPECTION_MODULES)
    let count = 0
    for (const module of INSPECTION_MODULES) {
      assert.equal(new Set(module.lessons.map(item => item.id)).size, module.lessons.length)
      for (const lesson of module.lessons) {
        for (const section of lesson.sections) {
          const query = new URLSearchParams({ module: module.id, lesson: lesson.id, section: section.id })
          assert.equal(resolveInspectionSelection(query).section, section)
          const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/admin/inspection?' + query] }, createElement(Page)))
          assert.ok(html.includes('管理员只读巡检'))
          assert.ok(html.includes(section.title))
          assert.ok(!html.includes('<audio') && !html.includes('<textarea'))
          count++
        }
      }
    }
    assert.equal(JSON.stringify(INSPECTION_MODULES), before)
    // Zustand uses its initial snapshot during server rendering.
    const gate = () => {
      Object.assign(useAccessStore.getInitialState(), useAccessStore.getState())
      return renderToStaticMarkup(createElement(RequireAdmin, null, createElement('p', null, 'PRIVATE_INSPECTION')))
    }
    useAccessStore.setState({ authChecked: true, accessChecked: true, isCheckingAuth: false, isCheckingAccess: false, isRegistered: false, isAdmin: false })
    assert.ok(!gate().includes('PRIVATE_INSPECTION'))
    useAccessStore.setState({ isRegistered: true })
    assert.ok(!gate().includes('PRIVATE_INSPECTION'))
    useAccessStore.getState().setAccessStatus({ role: 'admin', accessStatus: 'suspended' })
    assert.ok(!gate().includes('PRIVATE_INSPECTION'))
    useAccessStore.getState().setAccessStatus({ role: 'admin', accessStatus: 'active' })
    assert.ok(gate().includes('PRIVATE_INSPECTION'))
    for (const module of INSPECTION_MODULES) {
      for (const lesson of module.lessons) {
        for (const section of lesson.sections.filter(item => item.id !== 'source')) {
          const query = new URLSearchParams({ module: module.id, lesson: lesson.id, section: section.id, view: 'interactive' })
          const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/admin/inspection?' + query] }, createElement(Page)))
          assert.ok(html.includes('临时交互'))
          assert.ok(!html.includes('<audio'))
        }
      }
    }
    const { default: Navigation } = await server.ssrLoadModule('/src/components/training/FoundationLessonNavigation.jsx')
    const { TrainingInspectionContext } = await server.ssrLoadModule('/src/hooks/useTrainingInspection.js')
    const navigation = (inspection) => renderToStaticMarkup(createElement(TrainingInspectionContext.Provider, { value: inspection }, createElement(Navigation, { activeStep: 3, canAdvance: false })))
    assert.ok(navigation(false).includes('disabled=""'))
    assert.ok(!navigation(true).includes('disabled=""'))
    const { useAccessGuard } = await server.ssrLoadModule('/src/hooks/useAccessGuard.js')
    const { default: useEffectiveAccess } = await server.ssrLoadModule('/src/hooks/useEffectiveAccess.js')
    const { hasLegacyAccess } = await server.ssrLoadModule('/src/utils/accessPolicy.js')
    let observed
    function Probe() {
      observed = { guard: useAccessGuard(), effective: useEffectiveAccess() }
      return null
    }
    function probe(patch) {
      useAccessStore.setState(patch)
      Object.assign(useAccessStore.getInitialState(), useAccessStore.getState())
      renderToStaticMarkup(createElement(Probe))
      return observed
    }
    let result = probe({ role: 'member', isAdmin: false, accessStatus: 'active', previewMode: 'actual', isUnlocked: true })
    assert.equal(result.guard.canAccess('/generate-codes').reason, 'admin')
    assert.equal(result.guard.canAccess('/admin/inspection').reason, 'admin')
    result = probe({ role: 'admin', isAdmin: true, accessStatus: 'active', previewMode: 'premium', premiumUntil: '2000-01-01' })
    assert.equal(hasLegacyAccess(result.effective), true)
    assert.equal(result.guard.canAccess('/admin/inspection').canAccess, true)
    result = probe({ previewMode: 'anonymous' })
    assert.equal(result.guard.canAccess('/admin/inspection').canAccess, true)
    result = probe({ role: 'member', isAdmin: false, previewMode: 'actual', accessStatus: 'suspended', showUnlockModal: false })
    assert.equal(result.guard.guardRoute('/boarding-materials').reason, 'restricted')
    assert.equal(useAccessStore.getState().showUnlockModal, false)
    const { default: Interactive } = await server.ssrLoadModule('/src/components/InteractiveInspection.jsx')
    probe({ isAdmin: true, role: 'member', accessStatus: 'active' })
    assert.ok(renderToStaticMarkup(createElement(Interactive)).includes('需要有效管理员权限'))
    console.log('Route guards, suspended account prompts and admin preview expiry checks passed.')
    console.log('Interactive render and ordinary/inspection progression checks passed.')
    console.log('Inspection render and access checks passed: ' + count + ' sections; no storage/network access during render.')
  } finally {
    globalThis.fetch = originalFetch
    delete globalThis.localStorage
  }
} finally {
  await server.close()
}
