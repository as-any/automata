export type GraphDefinition<G, VertexShape> = {
  [Id in keyof G]: VertexShape;
}

export interface VertexAccessor<VertexShape, State, Id> {
  getId: (vertex: VertexShape) => Id
  getState: (vertex: VertexShape) => State
  getEdges: (vertex: VertexShape) => Id[]
}

export function * traverseGraphGenerator<G, VertexShape, State, Id extends keyof G = keyof G> (
  graph: GraphDefinition<G, VertexShape>,
  accessor: VertexAccessor<VertexShape, State, Id>
): Generator<[Id, Id]> {
  const visitedVertices = new Set<Id>()

  function * dfs (vertex: VertexShape, fromId?: Id): Generator<[Id, Id]> {
    const toId = accessor.getId(vertex)
    if (visitedVertices.has(toId)) {
      return
    }
    visitedVertices.add(toId)

    if (fromId !== undefined) {
      yield [fromId, toId]
    }

    const edges = accessor.getEdges(vertex)
    for (const edgeId of edges) {
      const nextVertex = graph[edgeId]
      if (nextVertex !== undefined) {
        yield * dfs(nextVertex, toId)
      }
    }
  }

  for (const key of Object.keys(graph) as Array<keyof typeof graph>) {
    const vertex = graph[key]
    if (!visitedVertices.has(key as Id)) {
      yield * dfs(vertex)
    }
  }
}
