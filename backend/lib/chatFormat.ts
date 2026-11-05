export type ChatMessageRow = {
  id: number;
  sender_role: 'giver' | 'receiver';
  texto: string;
  created_at: string | Date;
};

export function toIsoUtc(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value.replace(' ', 'T') + 'Z').toISOString();
}

export type FormattedMessage = {
  id: number;
  role: string;
  texto: string;
  timestamp: string;
};

const SYSTEM_TEXT: Record<'amigo' | 'admirador', string> = {
  amigo: 'Conexao criptografada estabelecida com o seu Amigo Secreto.',
  admirador: 'Conexao criptografada estabelecida com o seu Admirador Secreto.',
};

const OTHER_PARTY_LABEL: Record<'amigo' | 'admirador', string> = {
  amigo: 'Meu Amigo Secreto',
  admirador: 'Meu Admirador Secreto',
};

export function formatChannelMessages(
  rows: ChatMessageRow[],
  selfRole: 'giver' | 'receiver',
  channel: 'amigo' | 'admirador',
): FormattedMessage[] {
  const messages: FormattedMessage[] = [
    { id: 0, role: 'Sistema', texto: SYSTEM_TEXT[channel], timestamp: new Date().toISOString() },
  ];

  for (const row of rows) {
    const role = row.sender_role === selfRole ? 'Você' : OTHER_PARTY_LABEL[channel];
    messages.push({
      id: row.id,
      role,
      texto: row.texto,
      timestamp: toIsoUtc(row.created_at),
    });
  }

  return messages;
}
