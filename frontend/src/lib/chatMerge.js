export function mergeChannels({ amigo, admirador }) {
  const amigoMessages = amigo.map(m => ({ ...m, channel: 'amigo', key: `amigo-${m.id}` }));
  const admiradorMessages = admirador.map(m => ({ ...m, channel: 'admirador', key: `admirador-${m.id}` }));

  return [...amigoMessages, ...admiradorMessages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
