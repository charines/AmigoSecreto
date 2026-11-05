export type Assignment<T> = { giver: T; receiver: T };

export function pairParticipants<T>(participants: T[], shuffle: (arr: T[]) => T[]): Assignment<T>[] {
  const shuffled = shuffle(participants);
  const total = shuffled.length;

  return shuffled.map((giver, i) => ({
    giver,
    receiver: shuffled[(i + 1) % total],
  }));
}
