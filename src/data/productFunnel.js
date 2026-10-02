export const CONVERSION_FUNNEL_STAGES = [
  { id: 'assessment_viewed', label: '进入测评', eventName: 'assessment_viewed' },
  { id: 'assessment_auth_completed', label: '测评中完成登录', eventName: 'auth_completed', property: ['intentRoute', '/assessment'], optional: true },
  { id: 'assessment_started', label: '开始测评', eventName: 'assessment_started' },
  { id: 'assessment_completed', label: '完成测评', eventName: 'assessment_completed' },
  { id: 'career_report_generated', label: '生成职业报告', eventName: 'career_report_generated' },
  { id: 'free_trial_viewed', label: '进入免费场景', eventName: 'free_trial_viewed' },
  { id: 'free_trial_first_scene', label: '完成首个场景', eventName: 'free_trial_scenario_completed', property: ['completionOrder', 1], legacyProperty: ['scenarioNumber', 1] },
  { id: 'free_trial_completed', label: '完成 3 个场景', eventName: 'free_trial_completed' },
  { id: 'product_page_viewed', label: '查看付费页', eventName: 'product_page_viewed' },
  { id: 'purchase_request_submitted', label: '提交开通申请', eventName: 'purchase_request_submitted' },
  { id: 'activation_succeeded', label: '激活成功', eventName: 'activation_succeeded' },
]

export const CONVERSION_EVENT_NAMES = [...new Set([
  ...CONVERSION_FUNNEL_STAGES.map((stage) => stage.eventName),
  'assessment_result_viewed',
  'assessment_training_recommended_clicked',
  'free_trial_scenario_completed',
  'paywall_reached',
  'purchase_cta_clicked',
  'activation_cta_clicked',
  'manual_purchase_requested',
  'quick_feedback_submitted',
])]

const matchesStage = (event, stage) => {
  if (event.event_name !== stage.eventName) return false
  if (!stage.property) return true
  const [key, expected] = stage.property
  if (event.properties?.[key] === expected) return true
  if (event.properties?.[key] != null || !stage.legacyProperty) return false
  const [legacyKey, legacyExpected] = stage.legacyProperty
  return event.properties?.[legacyKey] === legacyExpected
}

const buildIdentityResolver = (events) => {
  const anonymousToUser = new Map()
  events.forEach((event) => {
    if (event.user_id && event.anonymous_id) anonymousToUser.set(event.anonymous_id, event.user_id)
  })

  return (event) => {
    const linkedUser = event.anonymous_id ? anonymousToUser.get(event.anonymous_id) : null
    if (linkedUser) return `user:${linkedUser}`
    if (event.user_id) return `user:${event.user_id}`
    return event.anonymous_id ? `anon:${event.anonymous_id}` : `event:${event.id}`
  }
}

export const buildConversionFunnel = (events = []) => {
  const getIdentity = buildIdentityResolver(events)
  let previousActors = null

  return CONVERSION_FUNNEL_STAGES.map((stage) => {
    const matchingEvents = events.filter((event) => matchesStage(event, stage))
    const actors = new Set(matchingEvents.map(getIdentity))
    const actorCount = actors.size
    const continuedActorCount = previousActors == null
      ? null
      : [...actors].filter((actor) => previousActors.has(actor)).length
    const conversionFromPrevious = previousActors == null || stage.optional
      ? null
      : previousActors.size > 0 ? Math.round((continuedActorCount / previousActors.size) * 100) : 0
    if (!stage.optional) previousActors = actors

    return {
      ...stage,
      actorCount,
      eventCount: matchingEvents.length,
      continuedActorCount,
      conversionFromPrevious,
    }
  })
}

export const buildTargetRoleBreakdown = (events = []) => {
  const labels = {
    undecided: '尚未确定', retail: '免税店', front_office: '前台', bar: 'Bar Server',
    restaurant: '餐厅', housekeeping: '客房', youth_staff: 'Youth Staff', beauty_spa: '美容 SPA',
  }
  const getIdentity = buildIdentityResolver(events)
  const actorsByRole = new Map()

  events
    .filter((event) => event.event_name === 'career_report_generated' && event.properties?.targetRole)
    .forEach((event) => {
      const role = event.properties.targetRole
      if (!actorsByRole.has(role)) actorsByRole.set(role, new Set())
      actorsByRole.get(role).add(getIdentity(event))
    })

  return [...actorsByRole.entries()]
    .map(([role, actors]) => ({ role, label: labels[role] || role, count: actors.size }))
    .sort((left, right) => right.count - left.count)
}
