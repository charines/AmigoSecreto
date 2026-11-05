import { describe, expect, it } from 'vitest';
import { pairParticipants } from './drawAlgorithm.js';

type P = { id: number; name: string; email: string };

describe('pairParticipants', () => {
  it('pairs each giver with the next participant in shuffle order (cyclic)', () => {
    const participants: P[] = [
      { id: 1, name: 'Ana', email: 'a@x.com' },
      { id: 2, name: 'Bob', email: 'b@x.com' },
      { id: 3, name: 'Caio', email: 'c@x.com' },
    ];
    // identity shuffle for a deterministic test
    const identityShuffle = <T,>(arr: T[]) => [...arr];

    const assignments = pairParticipants(participants, identityShuffle);

    expect(assignments).toEqual([
      { giver: participants[0], receiver: participants[1] },
      { giver: participants[1], receiver: participants[2] },
      { giver: participants[2], receiver: participants[0] },
    ]);
  });

  it('never assigns a participant to themselves, for any shuffle order', () => {
    const participants: P[] = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: `P${i}`,
      email: `p${i}@x.com`,
    }));

    for (let trial = 0; trial < 50; trial++) {
      const assignments = pairParticipants(participants, shuffleArray);
      for (const { giver, receiver } of assignments) {
        expect(giver.id).not.toBe(receiver.id);
      }
    }
  });
});

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
