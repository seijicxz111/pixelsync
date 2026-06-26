import { describe, expect, it } from "vitest";
import {
  OperationDeduper,
  createReconciliationState,
  missingSequenceNumbers,
  reconcileAcceptedOperation
} from "./reconciliation";

describe("sequence reconciliation", () => {
  it("applies operations in contiguous server order", () => {
    const state = createReconciliationState();

    expect(
      reconcileAcceptedOperation(state, {
        operationId: "00000000-0000-4000-8000-000000000001",
        sequenceNumber: 1
      })
    ).toEqual({ action: "APPLY", lastConfirmedSequence: 1 });
  });

  it("detects missing sequence numbers", () => {
    const state = createReconciliationState(4);

    expect(
      reconcileAcceptedOperation(state, {
        operationId: "00000000-0000-4000-8000-000000000010",
        sequenceNumber: 7
      })
    ).toEqual({ action: "MISSING", expectedSequence: 5, receivedSequence: 7 });
    expect(missingSequenceNumbers(4, 7)).toEqual([5, 6]);
  });

  it("deduplicates repeated operation IDs", () => {
    const deduper = new OperationDeduper(2);
    expect(deduper.add("a")).toBe(true);
    expect(deduper.add("a")).toBe(false);
    expect(deduper.add("b")).toBe(true);
    expect(deduper.add("c")).toBe(true);
    expect(deduper.has("a")).toBe(false);
  });
});
