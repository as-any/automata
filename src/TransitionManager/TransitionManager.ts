import { validateTransition } from '../validateTransition/validateTransition'

export type GraphDefinition<G, VertexShape> = {
  [Id in keyof G]: VertexShape;
}

type TransitionFunction = (data: any) => void

type Input = any

export interface StateContext<State, Id extends string | number> {
  state: State
  input: Input
  transitions: { [key in Id]?: TransitionFunction }
}

interface VertexOperator<VertexShape, State, Id> {
  getId: (vertex: VertexShape) => Id
  getEdges: (vertex: VertexShape) => Id[]
  getState: (vertex: VertexShape) => State
  getInitial: () => Id
}

const EventBus = {
  emit: (t: string, p: any) => {

  }
}

export class TransitionManager<G, VertexShape, State, Id extends (string | number) & keyof G> {
  private readonly operator: VertexOperator<VertexShape, State, Id>
  private readonly graph: GraphDefinition<G, VertexShape>
  private currentStateContext: StateContext<State, Id> | null = null
  private readonly transitionMap: Map<Id, { [key in Id]?: TransitionFunction }>

  constructor (
    graph: GraphDefinition<G, VertexShape>,
    operator: VertexOperator<VertexShape, State, Id>
  ) {
    this.operator = operator
    this.graph = graph
    this.transitionMap = new Map()
    this.initializeStateContext()
  }

  private initializeStateContext (): void {
    const initialStateId = this.operator.getInitial()
    this.updateStateContext(initialStateId, null)
  }

  private updateStateContext (stateId: Id, input: Input): void {
    const transitions = this.constructTransitionsForState(stateId)
    this.currentStateContext = {
      state: this.operator.getState(this.graph[stateId]),
      input,
      transitions
    }
  }

  private constructTransitionsForState (stateId: Id): { [key in Id]?: TransitionFunction } {
    const transitions: { [key in Id]?: TransitionFunction } = this.transitionMap.get(stateId) ?? {}
    const edges = this.operator.getEdges(this.graph[stateId])
    edges.forEach(edgeId => {
      if (transitions[edgeId] == null) {
        transitions[edgeId] = (input) => { this.handleTransition(stateId, edgeId, input) }
      }
    })
    return transitions
  }

  private handleTransition (fromId: Id, toId: Id, input: Input): void {
    const validationError = validateTransition(this.currentStateContext, fromId, toId, this.graph, this.operator)
    if (typeof validationError === 'string' && validationError.length > 0) {
      EventBus.emit('error', { message: validationError })
      return
    }

    this.updateStateContext(toId, input)

    EventBus.emit('transition', { fromId, toId, input })
  }

  public getStateContext (): StateContext<State, Id> | null {
    return this.currentStateContext
  }
}
