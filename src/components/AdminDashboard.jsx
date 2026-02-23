import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';

function parseInviteLines(text) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const parsed = [];

  for (const line of lines) {
    let name = '';
    let email = '';

    const angle = line.match(/^(.*)<([^>]+)>$/);
    if (angle) {
      name = angle[1].trim().replace(/["']/g, '');
      email = angle[2].trim();
    } else if (line.includes(',') || line.includes(';')) {
      const parts = line.split(/[;,]/);
      name = (parts[0] || '').trim();
      email = (parts[1] || '').trim();
    } else if (line.includes('@')) {
      const parts = line.split(/\s+/);
      const emailPart = parts.find((part) => part.includes('@')) || '';
      email = emailPart.trim();
      name = parts.filter((part) => part !== emailPart).join(' ').trim();
      if (!name) {
        name = email.split('@')[0];
      }
    }

    if (name && email) {
      parsed.push({ name, email });
    }
  }

  return parsed;
}

const STATUS_LABELS = {
  invited: 'Convite enviado',
  link_clicked: 'Link clicado',
  confirmed: 'Confirmado',
  token_sent: 'Token enviado',
  revealed: 'Revelado',
};

export default function AdminDashboard({ admin, onLogout }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [inviteText, setInviteText] = useState('');
  const [inviteResult, setInviteResult] = useState(null);
  const [drawResult, setDrawResult] = useState(null);
  const [groupForm, setGroupForm] = useState({
    title: '',
    description: '',
    draw_date: '',
    budget_limit: '',
  });

  const statusCounts = useMemo(() => {
    const counts = { invited: 0, link_clicked: 0, confirmed: 0, token_sent: 0, revealed: 0 };
    participants.forEach((p) => {
      if (counts[p.status] !== undefined) counts[p.status] += 1;
    });
    return counts;
  }, [participants]);

  const loadGroups = async () => {
    setLoadingGroups(true);
    setError('');
    try {
      const data = await apiGet('/groups_list.php');
      setGroups(data.groups || []);
      if (!selectedGroupId && data.groups?.length) {
        setSelectedGroupId(data.groups[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadGroupDetail = async (groupId) => {
    if (!groupId) return;
    setLoadingGroup(true);
    setError('');
    try {
      const data = await apiGet(`/groups_detail.php?id=${groupId}`);
      setSelectedGroup(data.group);
      setParticipants(data.participants || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingGroup(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupDetail(selectedGroupId);
    }
  }, [selectedGroupId]);

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    setNotice('');
    setError('');
    try {
      const payload = {
        title: groupForm.title.trim(),
        description: groupForm.description.trim(),
        draw_date: groupForm.draw_date,
        budget_limit: groupForm.budget_limit,
      };
      const data = await apiPost('/groups_create.php', payload);
      setGroupForm({ title: '', description: '', draw_date: '', budget_limit: '' });
      await loadGroups();
      setSelectedGroupId(data.group.id);
      setNotice('Grupo criado com sucesso.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInvite = async () => {
    setNotice('');
    setError('');
    setInviteResult(null);
    const parsed = parseInviteLines(inviteText);
    if (!selectedGroupId) {
      setError('Selecione um grupo.');
      return;
    }
    if (parsed.length === 0) {
      setError('Nenhum participante valido.');
      return;
    }
    try {
      const data = await apiPost('/groups_invite.php', {
        group_id: selectedGroupId,
        participants: parsed,
      });
      setInviteResult(data);
      setInviteText('');
      await loadGroupDetail(selectedGroupId);
      setNotice('Convites processados.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDraw = async () => {
    setNotice('');
    setError('');
    setDrawResult(null);
    if (!selectedGroupId) {
      setError('Selecione um grupo.');
      return;
    }
    try {
      const data = await apiPost('/groups_draw.php', { group_id: selectedGroupId });
      setDrawResult(data);
      await loadGroupDetail(selectedGroupId);
      await loadGroups();
      setNotice('Sorteio concluido e tokens enviados.');
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmedCount = statusCounts.confirmed;
  const canDraw = selectedGroup?.status === 'open' && confirmedCount >= 2;
  const drawLabel = selectedGroup?.status !== 'open'
    ? 'SORTEIO FINALIZADO'
    : canDraw
    ? 'EXECUTAR SORTEIO'
    : 'AGUARDANDO CONFIRMACOES';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-[11px] tracking-[0.2em] uppercase">
          Admin: {admin.name} ({admin.email})
        </div>
        <button className="crt-btn-sm" onClick={onLogout}>SAIR</button>
      </div>

      {error && (
        <p className="text-crt-red text-[10px] tracking-wider uppercase">
          ✖ {error}
        </p>
      )}
      {notice && (
        <p className="text-[10px] tracking-wider uppercase" style={{ color: 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.6)' }}>
          ✔ {notice}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-[10px] tracking-[0.3em] uppercase">Grupos</div>
            {loadingGroups && <p className="text-[10px] opacity-60">Carregando...</p>}
            {groups.length === 0 && !loadingGroups && (
              <p className="text-[10px] opacity-60">Nenhum grupo criado ainda.</p>
            )}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {groups.map((group) => (
                <button
                  key={group.id}
                  className="w-full text-left p-3 border"
                  style={{
                    borderColor: group.id === selectedGroupId
                      ? 'var(--color-crt-green)'
                      : 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.2)',
                  }}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <div className="text-sm">{group.title}</div>
                  <div className="text-[10px] opacity-60 uppercase">
                    {group.status} · {group.confirmed_count}/{group.total_participants} confirmados
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form className="space-y-3" onSubmit={handleCreateGroup}>
            <div className="text-[10px] tracking-[0.3em] uppercase">Criar grupo</div>
            <input
              className="crt-input w-full p-2 text-sm"
              placeholder="Titulo do grupo"
              value={groupForm.title}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <textarea
              className="crt-input w-full p-2 text-sm resize-none min-h-20"
              placeholder="Descricao (opcional)"
              value={groupForm.description}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <input
              className="crt-input w-full p-2 text-sm"
              type="text"
              placeholder="Data do sorteio (ex: 25/11/2026 10:30)"
              value={groupForm.draw_date}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, draw_date: e.target.value }))}
            />
            <input
              className="crt-input w-full p-2 text-sm"
              placeholder="Budget (ex: 100.00)"
              value={groupForm.budget_limit}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, budget_limit: e.target.value }))}
            />
            <button className="crt-btn" type="submit">CRIAR GRUPO</button>
          </form>
        </div>

        <div className="space-y-4">
          {!selectedGroup && (
            <p className="text-[10px] opacity-60">Selecione um grupo para ver os detalhes.</p>
          )}

          {selectedGroup && (
            <>
              <div className="space-y-1">
                <div className="text-[10px] tracking-[0.3em] uppercase">Detalhes do grupo</div>
                <div className="text-sm">{selectedGroup.title}</div>
                <div className="text-[10px] opacity-60 uppercase">
                  Status: {selectedGroup.status}
                </div>
                {selectedGroup.draw_date && (
                  <div className="text-[10px] opacity-60">Sorteio em: {selectedGroup.draw_date}</div>
                )}
              </div>

              <div className="text-[10px] tracking-[0.3em] uppercase">Status dos participantes</div>
              {loadingGroup && <p className="text-[10px] opacity-60">Carregando...</p>}
              {!loadingGroup && (
                <div className="space-y-2">
                  <div className="text-[10px] opacity-60 uppercase">
                    Confirmados: {statusCounts.confirmed} · Token enviados: {statusCounts.token_sent} · Revelados: {statusCounts.revealed}
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y" style={{ border: '1px solid rgb(var(--color-crt-green-raw, 57 255 132) / 0.2)' }}>
                    {participants.map((p) => (
                      <div key={p.id} className="px-3 py-2 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span>{p.name} — {p.email}</span>
                          <span className="text-[9px] uppercase opacity-70">
                            {STATUS_LABELS[p.status] || p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {participants.length === 0 && (
                      <div className="px-3 py-2 text-[10px] opacity-60">Nenhum participante ainda.</div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[10px] tracking-[0.3em] uppercase">Convidar participantes</div>
                <textarea
                  className="crt-input w-full p-2 text-sm resize-none min-h-24"
                  placeholder="Nome <email@dominio.com>\nNome, email@dominio.com"
                  value={inviteText}
                  onChange={(e) => setInviteText(e.target.value)}
                />
                <button className="crt-btn" type="button" onClick={handleInvite}>
                  ENVIAR CONVITES
                </button>
                {inviteResult && (
                  <div className="text-[10px] opacity-60 space-y-1">
                    <div>Enviados: {inviteResult.sent?.length || 0}</div>
                    {inviteResult.failed?.length > 0 && (
                      <div>Falhas: {inviteResult.failed.length}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-[10px] tracking-[0.3em] uppercase">Sorteio</div>
                <button className="crt-btn" type="button" onClick={handleDraw} disabled={!canDraw}>
                  {drawLabel}
                </button>
                {drawResult && (
                  <div className="text-[10px] opacity-60 space-y-1">
                    <div>Emails enviados: {drawResult.sent?.length || 0}</div>
                    {drawResult.failed?.length > 0 && (
                      <div>Falhas no envio: {drawResult.failed.length}</div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
