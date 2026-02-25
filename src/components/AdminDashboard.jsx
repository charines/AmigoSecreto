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
  invited: 'CONVITE ENVIADO',
  link_clicked: 'LINK CLICADO',
  confirmed: 'CONFIRMADO',
  token_sent: 'TOKEN ENVIADO',
  revealed: 'REVELADO',
};

export default function AdminDashboard({ admin, onLogout }) {
  const [view, setView] = useState('list'); // 'list', 'create', 'detail'
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
    if (view === 'detail' && selectedGroupId) {
      loadGroupDetail(selectedGroupId);
    }
  }, [view, selectedGroupId]);

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
      setView('detail');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInvite = async () => {
    setNotice('');
    setError('');
    setInviteResult(null);
    const parsed = parseInviteLines(inviteText);
    if (!selectedGroupId) return;
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
    if (!selectedGroupId) return;
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

  const renderList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-crt-green text-xs tracking-[0.3em] uppercase">Seus Grupos</h2>
        <button className="crt-btn-sm" onClick={() => setView('create')}>+ NOVO GRUPO</button>
      </div>

      {loadingGroups && <p className="text-[10px] opacity-60">Carregando lista...</p>}

      {!loadingGroups && groups.length === 0 && (
        <div className="p-8 border border-dashed border-crt-green/20 text-center">
          <p className="text-[10px] opacity-60 uppercase">Nenhum grupo encontrado</p>
        </div>
      )}

      <div className="grid gap-4">
        {groups.map((group) => (
          <button
            key={group.id}
            className="w-full text-left p-4 border border-crt-green/20 hover:border-crt-green/50 transition-colors group"
            onClick={() => {
              setSelectedGroupId(group.id);
              setView('detail');
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm group-hover:text-crt-green-bright transition-colors uppercase tracking-wider">{group.title}</div>
                <div className="text-[10px] opacity-60 mt-1 uppercase">
                  {group.confirmed_count}/{group.total_participants} PARTICIPANTES CONFIRMADOS
                </div>
              </div>
              <div className="text-[9px] border border-crt-green px-2 py-0.5 uppercase">
                {group.status}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCreate = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button className="text-[10px] opacity-60 hover:opacity-100" onClick={() => setView('list')}>[VOLTAR]</button>
        <h2 className="text-crt-green text-xs tracking-[0.3em] uppercase">Criar Grupo</h2>
      </div>

      <form className="space-y-4" onSubmit={handleCreateGroup}>
        <div className="space-y-4">
          <input
            className="crt-input w-full p-3 text-sm"
            placeholder="Titulo do grupo"
            value={groupForm.title}
            onChange={(e) => setGroupForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <textarea
            className="crt-input w-full p-3 text-sm resize-none min-h-24"
            placeholder="Descricao (opcional)"
            value={groupForm.description}
            onChange={(e) => setGroupForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <input
            className="crt-input w-full p-3 text-sm"
            type="text"
            placeholder="Data do sorteio (ex: 25/11/2026 10:30)"
            value={groupForm.draw_date}
            onChange={(e) => setGroupForm((prev) => ({ ...prev, draw_date: e.target.value }))}
          />
          <input
            className="crt-input w-full p-3 text-sm"
            placeholder="Budget (ex: 100.00)"
            value={groupForm.budget_limit}
            onChange={(e) => setGroupForm((prev) => ({ ...prev, budget_limit: e.target.value }))}
          />
        </div>
        <button className="crt-btn w-full" type="submit">CRIAR GRUPO</button>
      </form>
    </div>
  );

  const renderDetail = () => {
    if (loadingGroup) return <p className="text-[10px] opacity-60 uppercase">Carregando detalhes...</p>;
    if (!selectedGroup) return <p className="text-[10px] opacity-60 uppercase">Grupo não encontrado.</p>;

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="text-[10px] opacity-60 hover:opacity-100" onClick={() => setView('list')}>[VOLTAR]</button>
            <div className="space-y-1">
              <div className="text-[10px] tracking-[0.3em] uppercase opacity-60">Detalhes do grupo</div>
              <h2 className="text-crt-green-bright text-lg uppercase tracking-tight">{selectedGroup.title}</h2>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase opacity-60">Status</div>
            <div className="text-xs text-crt-green uppercase font-bold">{selectedGroup.status}</div>
          </div>
        </div>

        {selectedGroup.draw_date && (
          <div className="text-[10px] opacity-80 border-l-2 border-crt-green pl-2 uppercase">
            Sorteio em: <span className="text-crt-green">{selectedGroup.draw_date}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="text-[10px] tracking-[0.3em] uppercase text-crt-green">Status dos participantes</div>
          <div className="flex gap-4 text-[10px] opacity-60 uppercase">
            <span>CONFIRMADOS: <b className="text-crt-green">{statusCounts.confirmed}</b></span>
            <span>·</span>
            <span>TOKEN ENVIADOS: <b className="text-crt-green">{statusCounts.token_sent}</b></span>
            <span>·</span>
            <span>REVELADOS: <b className="text-crt-green">{statusCounts.revealed}</b></span>
          </div>

          <div className="border border-crt-green/20 overflow-hidden">
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {participants.map((p) => (
                <div key={p.id} className="group p-3 border-b border-crt-green/10 last:border-0 hover:bg-crt-green/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{p.name} <span className="opacity-40">- -</span> {p.email}</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-crt-green opacity-70">
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </div>
                </div>
              ))}
              {participants.length === 0 && (
                <div className="p-4 text-center text-[10px] opacity-40 uppercase">Nenhum participante ainda</div>
              )}
            </div>
          </div>
        </div>

        {selectedGroup.status === 'open' && (
          <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-crt-green/10">
            <div className="space-y-3">
              <div className="text-[10px] tracking-[0.3em] uppercase opacity-60">Convidar participantes</div>
              <textarea
                className="crt-input w-full p-3 text-xs resize-none min-h-24"
                placeholder="Nome <email@dominio.com>&#10;Nome, email@dominio.com"
                value={inviteText}
                onChange={(e) => setInviteText(e.target.value)}
              />
              <button className="crt-btn w-full py-2 text-xs" type="button" onClick={handleInvite}>
                ENVIAR CONVITES
              </button>
              {inviteResult && (
                <div className="text-[9px] opacity-60 uppercase bg-crt-green/5 p-2">
                  Enviados: {inviteResult.sent?.length || 0} / Falhas: {inviteResult.failed?.length || 0}
                </div>
              )}
            </div>

            <div className="space-y-3 flex flex-col justify-end">
              <div className="text-[10px] tracking-[0.3em] uppercase opacity-60">Sorteio</div>
              <button
                className={`crt-btn w-full py-4 text-sm ${!canDraw ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                type="button"
                onClick={handleDraw}
                disabled={!canDraw}
              >
                {drawLabel}
              </button>
              {drawResult && (
                <div className="text-[9px] opacity-60 uppercase bg-crt-green/5 p-2">
                  Emails: {drawResult.sent?.length || 0} / Falhas: {drawResult.failed?.length || 0}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-crt-green/10">
        <div className="text-[9px] tracking-[0.2em] uppercase opacity-40">
          SYSTEM_ACCESS: {admin.email}
        </div>
        <button className="text-[10px] border border-crt-red/30 text-crt-red px-2 py-0.5 hover:bg-crt-red/10 transition-colors" onClick={onLogout}>DISCONNECT</button>
      </div>

      {error && (
        <div className="bg-crt-red/5 border border-crt-red/30 p-2">
          <p className="text-crt-red text-[10px] tracking-wider uppercase">
            ERROR_LOG: {error}
          </p>
        </div>
      )}
      {notice && (
        <div className="bg-crt-green/5 border border-crt-green/30 p-2">
          <p className="text-[10px] tracking-wider uppercase text-crt-green">
            SYSTEM_MSG: {notice}
          </p>
        </div>
      )}

      {view === 'list' && renderList()}
      {view === 'create' && renderCreate()}
      {view === 'detail' && renderDetail()}
    </div>
  );
}

