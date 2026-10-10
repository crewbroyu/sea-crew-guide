// Runs the paid first scenario turn so that a retry of the same answer never pays twice.
//
// The AI follow-up and the draft save are separate steps. Once the follow-up has been generated
// (and charged), it is kept in `state` and a retry only repeats the draft save. The request id is
// kept across failed attempts too: the quota RPC reuses a failed reservation for the same id.
export const createFirstTurnState = () => ({ key: null, requestId: null, followUp: null })

export const runFirstScenarioTurn = async ({ state, scenarioId, answer, createRequestId, requestFollowUp, saveDraft }) => {
  const key = `${scenarioId}\n${answer}`
  if (state.key !== key) {
    state.key = key
    state.requestId = createRequestId()
    state.followUp = null
  }

  if (!state.followUp) {
    try {
      state.followUp = await requestFollowUp(state.requestId)
    } catch (error) {
      if (error?.code !== 'AI_REQUEST_ALREADY_COMPLETED') throw error
      // An earlier attempt with this id was charged but its reply never reached the browser, and the
      // server keeps no copy of the follow-up. The learner already asked to retry, so ask once more.
      state.requestId = createRequestId()
      state.followUp = await requestFollowUp(state.requestId)
    }
  }

  const savedDraft = await saveDraft(state.followUp)
  return { followUp: state.followUp, savedDraft }
}
