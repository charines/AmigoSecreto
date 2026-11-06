import { describe, it, expect } from 'vitest';
import { mergeChannels } from './chatMerge';

describe('mergeChannels', () => {
  it('mescla mensagens dos dois canais em ordem cronológica', () => {
    const result = mergeChannels({
      amigo: [
        { id: 1, role: 'Você', texto: 'oi', timestamp: '2026-11-06T10:00:00.000Z' },
        { id: 3, role: 'Meu Amigo Secreto', texto: 'oi de volta', timestamp: '2026-11-06T10:02:00.000Z' },
      ],
      admirador: [
        { id: 2, role: 'Meu Admirador Secreto', texto: 'ola', timestamp: '2026-11-06T10:01:00.000Z' },
      ],
    });

    expect(result.map(m => m.id)).toEqual([1, 2, 3]);
    expect(result.map(m => m.channel)).toEqual(['amigo', 'admirador', 'amigo']);
  });

  it('preserva ordem estável (amigo antes de admirador) em empate de timestamp', () => {
    const sameTimestamp = '2026-11-06T10:00:00.000Z';
    const result = mergeChannels({
      amigo: [{ id: 5, role: 'Sistema', texto: 'conectado ao amigo', timestamp: sameTimestamp }],
      admirador: [{ id: 5, role: 'Sistema', texto: 'conectado ao admirador', timestamp: sameTimestamp }],
    });

    expect(result.map(m => m.channel)).toEqual(['amigo', 'admirador']);
  });

  it('gera identidade única mesmo quando o id colide entre canais (mensagens de sistema id:0)', () => {
    const result = mergeChannels({
      amigo: [{ id: 0, role: 'Sistema', texto: 'conectado ao amigo', timestamp: '2026-11-06T10:00:00.000Z' }],
      admirador: [{ id: 0, role: 'Sistema', texto: 'conectado ao admirador', timestamp: '2026-11-06T10:01:00.000Z' }],
    });

    const keys = result.map(m => m.key);
    expect(new Set(keys).size).toBe(2);
    expect(keys).toEqual(['amigo-0', 'admirador-0']);
  });

  it('funciona com um canal vazio', () => {
    const result = mergeChannels({
      amigo: [{ id: 1, role: 'Você', texto: 'oi', timestamp: '2026-11-06T10:00:00.000Z' }],
      admirador: [],
    });

    expect(result).toHaveLength(1);
    expect(result[0].channel).toBe('amigo');
  });

  it('funciona com os dois canais vazios', () => {
    const result = mergeChannels({ amigo: [], admirador: [] });

    expect(result).toEqual([]);
  });
});
