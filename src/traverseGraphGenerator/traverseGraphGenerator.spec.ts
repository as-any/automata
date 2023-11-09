import { traverseGraphGenerator, type GraphDefinition, type VertexAccessor } from './traverseGraphGenerator'

type TestGraph = Record<string, { id: string, state: string, edges: string[] }>

describe('traverseGraphGenerator', () => {
  let accessor: VertexAccessor<{ id: string, state: string, edges: string[] }, string, string>

  beforeEach(() => {
    accessor = {
      getId: (vertex) => vertex.id,
      getState: (vertex) => vertex.state,
      getEdges: (vertex) => vertex.edges
    }
  })

  afterEach(() => {
    accessor = null as any
  })

  it('should yield edges in depth-first order', () => {
    type NamedVertexGraph = Record<string, { name: string, state: number, connections: string[] }>

    const namedGraph: GraphDefinition<NamedVertexGraph, { name: string, state: number, connections: string[] }> = {
      One: { name: 'One', state: 1, connections: ['Two'] },
      Two: { name: 'Two', state: 2, connections: ['Three'] },
      Three: { name: 'Three', state: 3, connections: [] }
    }

    const namedAccessor: VertexAccessor<{ name: string, state: number, connections: string[] }, number, string> = {
      getId: (vertex) => vertex.name,
      getState: (vertex) => vertex.state,
      getEdges: (vertex) => vertex.connections
    }

    const generator = traverseGraphGenerator(namedGraph, namedAccessor)
    const result = Array.from(generator)

    const expectedTraversal = [['One', 'Two'], ['Two', 'Three']]
    expect(result).toEqual(expectedTraversal)
  })

  it('should handle graphs where nodes have multiple edges', () => {
    const multiEdgeGraph: GraphDefinition<TestGraph, { id: string, state: string, edges: string[] }> = {
      A: { id: 'A', state: 'alpha', edges: ['B', 'C'] },
      B: { id: 'B', state: 'beta', edges: ['D'] },
      C: { id: 'C', state: 'gamma', edges: [] },
      D: { id: 'D', state: 'delta', edges: [] }
    }
    const generator = traverseGraphGenerator(multiEdgeGraph, accessor)
    const result = Array.from(generator)

    const expectedTraversalMultiEdge = [['A', 'B'], ['B', 'D'], ['A', 'C']]
    expect(result).toEqual(expectedTraversalMultiEdge)
  })

  it('should handle an empty graph', () => {
    const emptyGraph: GraphDefinition<Record<string, unknown>, Record<string, unknown>> = {}
    const emptyAccessor: VertexAccessor<Record<string, unknown>, undefined, string> = {
      getId: vertex => '',
      getState: vertex => undefined,
      getEdges: vertex => []
    }
    const generator = traverseGraphGenerator(emptyGraph, emptyAccessor)
    const result = Array.from(generator)

    expect(result).toEqual([])
  })

  it('should handle a graph with a single node and no edges', () => {
    const singleNodeGraph: GraphDefinition<TestGraph, { id: string, state: string, edges: string[] }> = {
      A: { id: 'A', state: 'alpha', edges: [] }
    }
    const generator = traverseGraphGenerator(singleNodeGraph, accessor)
    const result = Array.from(generator)

    expect(result).toEqual([])
  })

  it('should handle graphs with cycles', () => {
    const cyclicGraph: GraphDefinition<TestGraph, { id: string, state: string, edges: string[] }> = {
      A: { id: 'A', state: 'alpha', edges: ['B'] },
      B: { id: 'B', state: 'beta', edges: ['C'] },
      C: { id: 'C', state: 'gamma', edges: ['A'] }
    }
    const generator = traverseGraphGenerator(cyclicGraph, accessor)
    const result = Array.from(generator)

    const expectedTraversalWithCycle = [['A', 'B'], ['B', 'C']]
    expect(result).toEqual(expectedTraversalWithCycle)
  })

  it('should handle disconnected graphs', () => {
    const disconnectedGraph: GraphDefinition<TestGraph, { id: string, state: string, edges: string[] }> = {
      A: { id: 'A', state: 'alpha', edges: [] },
      B: { id: 'B', state: 'beta', edges: [] },
      C: { id: 'C', state: 'gamma', edges: [] }
    }
    const generator = traverseGraphGenerator(disconnectedGraph, accessor)
    const result = Array.from(generator)

    expect(result).toEqual([])
  })

  it('should complete traversal even if some nodes do not exist in the graph', () => {
    const incompleteGraph: GraphDefinition<TestGraph, { id: string, state: string, edges: string[] }> = {
      A: { id: 'A', state: 'alpha', edges: ['B'] },
      B: { id: 'B', state: 'beta', edges: ['C'] } // 'C' does not exist in the graph
      // 'C' is missing
    }
    const generator = traverseGraphGenerator(incompleteGraph, accessor)
    const result = Array.from(generator)

    const expectedTraversalIncomplete = [['A', 'B']]
    expect(result).toEqual(expectedTraversalIncomplete)
  })

  it('should discover each edge exactly once', () => {
    const testGraph: GraphDefinition<TestGraph, { id: string, state: string, edges: string[] }> = {
      A: { id: 'A', state: 'alpha', edges: ['B', 'C'] },
      B: { id: 'B', state: 'beta', edges: ['D'] },
      C: { id: 'C', state: 'gamma', edges: [] },
      D: { id: 'D', state: 'delta', edges: [] }
    }

    const generator = traverseGraphGenerator(testGraph, accessor)
    const result = Array.from(generator)

    const edgesSet = new Set<string>()

    for (const [from, to] of result) {
      edgesSet.add(`${from} -> ${to}`)
    }

    expect(edgesSet.size).toBe(3)
  })

  it('should discover each vertex exactly once', () => {
    const testGraph: GraphDefinition<TestGraph, { id: string, state: string, edges: string[] }> = {
      A: { id: 'A', state: 'alpha', edges: ['B', 'C'] },
      B: { id: 'B', state: 'beta', edges: ['D'] },
      C: { id: 'C', state: 'gamma', edges: [] },
      D: { id: 'D', state: 'delta', edges: [] }
    }

    const generator = traverseGraphGenerator(testGraph, accessor)
    const result = Array.from(generator)

    const verticesSet = new Set<string>()

    for (const [from, to] of result) {
      verticesSet.add(from)
      verticesSet.add(to)
    }

    // In this graph, there are 4 vertices: A, B, C, D
    expect(verticesSet.size).toBe(4)
  })
})
