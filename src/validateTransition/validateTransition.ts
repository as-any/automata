export function validateTransition<Id extends string | number = any> (
  currentContext: any | null,
  fromId: Id,
  toId: Id,
  graph: any,
  operator: any
): string | null {
  if (currentContext == null) {
    return 'Current state is not defined.'
  }

  if (currentContext.state !== fromId) {
    return `Invalid transition attempt from ${fromId}, current state is ${currentContext.state}.`
  }

  if (graph[toId] == null) {
    return `Destination vertex ${toId} does not exist in the graph.`
  }

  const edges = operator.getEdges(graph[fromId]) as any[]
  if (!edges.includes(toId)) {
    return `Transition from ${fromId} to ${toId} is not allowed.`
  }

  if (edges.length === 0) {
    return `Reached a leaf node at ${fromId}, no further transitions possible.`
  }

  return null
}
