import { type AcceptedCanvasOperation } from "./events";

export type SequenceDecision =
  | { action: "APPLY"; lastConfirmedSequence: number }
  | { action: "DUPLICATE"; lastConfirmedSequence: number }
  | { action: "MISSING"; expectedSequence: number; receivedSequence: number }
  | { action: "STALE"; lastConfirmedSequence: number };

export type ReconciliationState = {
  lastConfirmedSequence: number;
  acknowledgedOperationIds: Set<string>;
};

export function createReconciliationState(lastConfirmedSequence = 0): ReconciliationState {
  return {
    lastConfirmedSequence,
    acknowledgedOperationIds: new Set<string>()
  };
}

export function reconcileAcceptedOperation(
  state: ReconciliationState,
  operation: Pick<AcceptedCanvasOperation, "operationId" | "sequenceNumber">
): SequenceDecision {
  if (state.acknowledgedOperationIds.has(operation.operationId)) {
    return { action: "DUPLICATE", lastConfirmedSequence: state.lastConfirmedSequence };
  }

  if (operation.sequenceNumber <= state.lastConfirmedSequence) {
    state.acknowledgedOperationIds.add(operation.operationId);
    return { action: "STALE", lastConfirmedSequence: state.lastConfirmedSequence };
  }

  const expectedSequence = state.lastConfirmedSequence + 1;
  if (operation.sequenceNumber !== expectedSequence) {
    return { action: "MISSING", expectedSequence, receivedSequence: operation.sequenceNumber };
  }

  state.acknowledgedOperationIds.add(operation.operationId);
  state.lastConfirmedSequence = operation.sequenceNumber;
  return { action: "APPLY", lastConfirmedSequence: state.lastConfirmedSequence };
}

export class OperationDeduper {
  private readonly ids = new Set<string>();
  private readonly order: string[] = [];

  public constructor(private readonly maxEntries = 10_000) {}

  public has(operationId: string): boolean {
    return this.ids.has(operationId);
  }

  public add(operationId: string): boolean {
    if (this.ids.has(operationId)) {
      return false;
    }

    this.ids.add(operationId);
    this.order.push(operationId);

    while (this.order.length > this.maxEntries) {
      const oldest = this.order.shift();
      if (oldest !== undefined) {
        this.ids.delete(oldest);
      }
    }

    return true;
  }

  public get size(): number {
    return this.ids.size;
  }
}

export function missingSequenceNumbers(lastConfirmedSequence: number, receivedSequence: number): number[] {
  if (receivedSequence <= lastConfirmedSequence + 1) {
    return [];
  }

  const missing: number[] = [];
  for (let sequence = lastConfirmedSequence + 1; sequence < receivedSequence; sequence += 1) {
    missing.push(sequence);
  }

  return missing;
}
