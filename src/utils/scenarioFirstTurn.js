// Runs the paid first scenario turn so that a retry of the same answer never pays twice.
//
// The server saves the follow-up as the draft, tagged with the request id, before the turn is
// charged. Keeping the id across failed attempts lets a retry return that saved draft for free,
// or reuse the failed quota reservation when nothing was generated.
export const createFirstTurnState = () => ({ key: null, requestId: null })

export const runFirstScenarioTurn = async ({ state, scenarioId, answer, createRequestId, requestFollowUp }) => {
  const key = `${scenarioId}\n${answer}`
  if (state.key !== key) {
    state.key = key
    state.requestId = createRequestId()
  }

  try {
    return await requestFollowUp(state.requestId)
  } catch (error) {
    if (error?.code !== 'AI_REQUEST_ALREADY_COMPLETED') throw error
    // Fallback: this id was charged but its saved draft could not be found (for example it was
    // already completed elsewhere). The learner asked to retry, so ask once more with a new id.
    state.requestId = createRequestId()
    return requestFollowUp(state.requestId)
  }
}
