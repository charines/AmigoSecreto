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

const STATUS_BADGE = {
  invited:      { bg: 'bg-surface-variant', text: 'text-on-surface-variant' },
  link_clicked: { bg: 'bg-surface-container-high', text: 'text-on-surface' },
  confirmed:    { bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
  token_sent:   { bg: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
  revealed:     { bg: 'bg-primary', text: 'text-on-primary' },
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
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [pendingParticipants, setPendingParticipants] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [sendingSuccess, setSendingSuccess] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawSuccess, setDrawSuccess] = useState(false);
  const [drawStep, setDrawStep] = useState(0);
  const [dots, setDots] = useState('');
  const [groupForm, setGroupForm] = useState({
    title: '',
    description: '',
    draw_date: '',
    budget_limit: '',
  });
  const [drawResult, setDrawResult] = useState(null);
  const [isResending, setIsResending] = useState(false);

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

  useEffect(() => {
    let interval;
    if ((isSending || isDrawing) && !sendingSuccess && !drawSuccess) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
    } else {
      setDots('');
    }
    return () => clearInterval(interval);
  }, [isSending, isDrawing, sendingSuccess, drawSuccess]);

  useEffect(() => {
    let interval;
    if (isDrawing && !drawSuccess) {
      interval = setInterval(() => {
        setDrawStep((prev) => (prev >= 3 ? 0 : prev + 1));
      }, 2000);
    } else if (drawSuccess) {
      setDrawStep(4);
    } else {
      setDrawStep(0);
    }
    return () => clearInterval(interval);
  }, [isDrawing, drawSuccess]);

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

  const addPendingParticipant = (e) => {
    e?.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    if (!inviteEmail.includes('@')) {
      setError('Email invalido.');
      return;
    }
    setPendingParticipants([...pendingParticipants, {
      id: Date.now(),
      name: inviteName.trim(),
      email: inviteEmail.trim()
    }]);
    setInviteName('');
    setInviteEmail('');
    setError('');
  };

  const removePendingParticipant = (id) => {
    setPendingParticipants(pendingParticipants.filter(p => p.id !== id));
  };

  const handleInvite = async () => {
    if (!selectedGroupId || pendingParticipants.length === 0) return;

    setNotice('');
    setError('');
    setIsSending(true);
    setSendingSuccess(false);

    try {
      const data = await apiPost('/groups_invite.php', {
        group_id: selectedGroupId,
        participants: pendingParticipants.map(({ name, email }) => ({ name, email })),
      });
      setInviteResult(data);
      setPendingParticipants([]);
      await loadGroupDetail(selectedGroupId);
      setSendingSuccess(true);
      setNotice('Participantes notificados! Verifique o spam de: amigo.secreto@mercadocompleto.com.br');
    } catch (err) {
      setError(err.message);
      setIsSending(false);
    }
  };

  const handleDraw = async () => {
    if (!selectedGroupId) return;

    setNotice('');
    setError('');
    setDrawResult(null);
    setIsDrawing(true);
    setDrawSuccess(false);
    setDrawStep(0);

    try {
      const data = await apiPost('/groups_draw.php', { group_id: selectedGroupId });
      setDrawResult(data);
      await loadGroupDetail(selectedGroupId);
      await loadGroups();
      setDrawSuccess(true);
      setNotice('Sorteio concluido e tokens enviados.');
    } catch (err) {
      setError(err.message);
      setIsDrawing(false);
    }
  };

  const handleDeleteGroup = async (e, groupId) => {
    e.stopPropagation();
    if (!window.confirm('TEM CERTEZA QUE DESEJA DELETAR ESTE GRUPO? ESTA ACO INTERROMPE TUDO E E IRREVERSIVEL.')) return;
    try {
      await apiPost('/groups_delete.php', { group_id: groupId });
      setNotice('Grupo deletado com sucesso.');
      loadGroups();
      if (selectedGroupId === groupId) {
        setView('list');
        setSelectedGroupId(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResendParticipantInvite = async (participantId) => {
    setIsResending(true);
    setNotice('');
    setError('');
    try {
      await apiPost('/participants_resend_invite.php', { participant_id: participantId });
      setNotice('Convite reenviado com sucesso! Avise o participante para checar o spam.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleResendParticipantDraw = async (participantId) => {
    setIsResending(true);
    setNotice('');
    setError('');
    try {
      await apiPost('/participants_resend_draw.php', { participant_id: participantId });
      setNotice('Resultado do sorteio reenviado com sucesso! Avise o participante para checar o spam.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleDeleteParticipant = async (participantId) => {
    const isDrawn = selectedGroup?.status === 'drawn';
    const message = isDrawn
      ? 'REMOVER ESTE PARTICIPANTE IRÁ CANCELAR O SORTEIO ATUAL! Todos os tokens enviados deixarão de funcionar e você precisará sortear novamente. Deseja continuar?'
      : 'Tem certeza que deseja remover este participante?';

    if (!window.confirm(message)) return;

    try {
      await apiPost('/participants_delete.php', { participant_id: participantId });
      setNotice('Participante removido com sucesso.');
      await loadGroupDetail(selectedGroupId);
      if (isDrawn) {
        await loadGroups();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getDisplayStatus = (group) => {
    if (!group) return '';

    const isDrawn = group.status === 'drawn';

    let tokenSent = 0;
    let revealed = 0;
    if (group.id === selectedGroup?.id) {
      tokenSent = statusCounts.token_sent;
      revealed = statusCounts.revealed;
    } else {
      tokenSent = parseInt(group.token_sent_count || 0);
      revealed = parseInt(group.revealed_count || 0);
    }

    if (isDrawn && revealed > 0 && tokenSent === 0) {
      return 'FECHADO';
    }

    if (group.draw_date) {
      const dateStr = group.draw_date.includes(' ') ? group.draw_date.replace(' ', 'T') : group.draw_date;
      const eventDate = new Date(dateStr);
      if (!isNaN(eventDate.getTime()) && new Date() < new Date()) {
        if (group.status === 'open') return 'FECHADO';
      }
    }

    const map = {
      'open': 'ABERTO',
      'drawn': 'SORTEADO',
      'cancelled': 'CANCELADO'
    };
    return map[group.status] || group.status.toUpperCase();
  };

  const confirmedCount = statusCounts.confirmed;
  const canDraw = selectedGroup?.status === 'open' && confirmedCount >= 2;
  const drawLabel = selectedGroup?.status !== 'open'
    ? 'SORTEIO FINALIZADO'
    : canDraw
      ? 'EXECUTAR SORTEIO'
      : 'AGUARDANDO CONFIRMAÇÕES';

  /* ── Header compartilhado ── */
  const renderHeader = (title, showBack = false) => (
    <header className="nb-header">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            className="flex items-center justify-center w-10 h-10 border-2 border-[var(--color-nb-ink)] bg-surface-container-highest nb-shadow-sm nb-press"
            onClick={() => setView('list')}
          >
            <span className="material-symbols-outlined text-on-surface" style={{ fontVariationSettings: "'wght' 700" }}>arrow_back</span>
          </button>
        )}
        {!showBack && (
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
        )}
        <h1 className="text-[1.75rem] leading-tight font-black text-primary italic" style={{ fontFamily: 'var(--font-nb)' }}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="text-xs border border-error text-error px-3 py-1 rounded font-bold hover:bg-error hover:text-on-error transition-colors"
          style={{ fontFamily: 'var(--font-nb)' }}
          onClick={onLogout}
        >
          SAIR
        </button>
        <div className="w-10 h-10 rounded-full border-2 border-[var(--color-nb-ink)] bg-secondary-container overflow-hidden nb-shadow-sm flex items-center justify-center">
          <span className="text-xs font-black text-on-secondary-container" style={{ fontFamily: 'var(--font-nb)' }}>
            {admin.email?.[0]?.toUpperCase() || 'A'}
          </span>
        </div>
      </div>
    </header>
  );

  /* ── Alertas inline ── */
  const renderAlerts = () => (
    <>
      {error && (
        <div className="bg-error-container border-2 border-error rounded-xl p-3 nb-shadow-sm">
          <p className="text-on-error-container text-sm font-bold" style={{ fontFamily: 'var(--font-nb)' }}>
            ✖ {error}
          </p>
        </div>
      )}
      {notice && !isSending && !isDrawing && (
        <div className="bg-secondary-container border-2 border-[var(--color-nb-ink)] rounded-xl p-3 nb-shadow-sm">
          <p className="text-on-secondary-container text-sm font-bold" style={{ fontFamily: 'var(--font-nb)' }}>
            ✓ {notice}
          </p>
        </div>
      )}
    </>
  );

  /* ── View: Lista de grupos ── */
  const renderList = () => (
    <div className="star-pattern min-h-screen pb-24" style={{ fontFamily: 'var(--font-nb)' }}>
      {renderHeader('AmigoSecreto')}

      <main className="max-w-4xl mx-auto px-5 py-10 space-y-6">
        {renderAlerts()}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[2rem] leading-tight font-black text-on-surface">Meus Grupos</h2>
            <div className="h-1 w-24 bg-primary border-2 border-[var(--color-nb-ink)] rounded-full mt-1"></div>
          </div>
        </div>

        {loadingGroups && (
          <p className="text-on-surface-variant font-bold text-sm animate-pulse">Carregando grupos...</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => {
            const status = getDisplayStatus(group);
            const isDrawn = group.status === 'drawn';
            return (
              <div
                key={group.id}
                className="nb-card p-6 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--color-nb-ink)] transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border-2 border-[var(--color-nb-ink)] w-fit tracking-tighter ${
                      isDrawn ? 'bg-secondary-container text-on-secondary-container' : 'bg-[#22c55e] text-white'
                    }`}>
                      {status}
                    </span>
                    <h3 className="text-xl font-extrabold text-on-surface">{group.title}</h3>
                  </div>
                  <button
                    className="text-on-surface-variant hover:text-error transition-colors"
                    title="Deletar grupo"
                    onClick={(e) => handleDeleteGroup(e, group.id)}
                  >
                    <span className="material-symbols-outlined text-2xl">delete</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isDrawn ? 'visibility' : 'group'}
                  </span>
                  <p className="font-semibold text-on-surface text-sm">
                    {isDrawn
                      ? `${group.revealed_count || 0} revelados`
                      : `${group.confirmed_count || 0}/${group.total_participants || 0} confirmados`}
                  </p>
                </div>

                <div className="w-full bg-surface-container-low border-2 border-[var(--color-nb-ink)] rounded-lg p-3 flex items-center justify-between">
                  <div className="text-xs font-semibold text-on-surface-variant">
                    {group.draw_date ? `📅 ${group.draw_date}` : 'Sem data definida'}
                  </div>
                  <button
                    className="nb-btn-secondary px-4 py-1 rounded-lg text-sm"
                    onClick={() => { setSelectedGroupId(group.id); setView('detail'); }}
                  >
                    GERENCIAR
                  </button>
                </div>
              </div>
            );
          })}

          {/* Card vazio / criar novo */}
          <div
            className="bg-surface-container border-2 border-[var(--color-nb-ink)] border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-4 opacity-70 hover:opacity-100 transition-opacity cursor-pointer min-h-[200px]"
            onClick={() => setView('create')}
          >
            <div className="w-16 h-16 rounded-full bg-white border-2 border-[var(--color-nb-ink)] flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">add_circle</span>
            </div>
            <p className="text-xl font-extrabold text-center text-on-surface">Criar um novo grupo</p>
          </div>
        </div>
      </main>

      {/* FAB */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <button
          className="flex items-center gap-3 bg-secondary-container px-8 py-4 rounded-full border-[3px] border-[var(--color-nb-ink)] nb-shadow-lg nb-press-lg transition-transform hover:scale-105"
          style={{ fontFamily: 'var(--font-nb)' }}
          onClick={() => setView('create')}
        >
          <span className="material-symbols-outlined text-3xl font-black">add</span>
          <span className="text-xl font-black tracking-tight text-on-secondary-container">NOVO GRUPO</span>
        </button>
      </div>
    </div>
  );

  /* ── View: Criar grupo ── */
  const renderCreate = () => (
    <div className="dot-pattern min-h-screen" style={{ fontFamily: 'var(--font-nb)' }}>
      {renderHeader('Criar Grupo', true)}

      <main className="max-w-[600px] mx-auto px-5 py-8 space-y-4">
        {renderAlerts()}

        <h2 className="text-2xl font-black text-on-surface">Novo Grupo</h2>

        <form className="space-y-4" onSubmit={handleCreateGroup}>
          <input
            className="nb-input w-full p-3 rounded-xl text-sm text-on-surface"
            style={{ fontFamily: 'var(--font-nb)' }}
            placeholder="Título do grupo"
            value={groupForm.title}
            onChange={(e) => setGroupForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <textarea
            className="nb-input w-full p-3 rounded-xl text-sm text-on-surface resize-none min-h-24"
            style={{ fontFamily: 'var(--font-nb)' }}
            placeholder="Descrição (opcional)"
            value={groupForm.description}
            onChange={(e) => setGroupForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <input
            className="nb-input w-full p-3 rounded-xl text-sm text-on-surface"
            style={{ fontFamily: 'var(--font-nb)' }}
            type="text"
            placeholder="Data do evento (ex: 25/11/2026 10:30)"
            value={groupForm.draw_date}
            onChange={(e) => setGroupForm((prev) => ({ ...prev, draw_date: e.target.value }))}
          />
          <input
            className="nb-input w-full p-3 rounded-xl text-sm text-on-surface"
            style={{ fontFamily: 'var(--font-nb)' }}
            placeholder="Budget (ex: 100.00)"
            value={groupForm.budget_limit}
            onChange={(e) => setGroupForm((prev) => ({ ...prev, budget_limit: e.target.value }))}
          />
          <button
            className="nb-btn-primary w-full py-4 rounded-xl text-base"
            type="submit"
          >
            CRIAR GRUPO
          </button>
        </form>
      </main>
    </div>
  );

  /* ── View: Detalhes do grupo ── */
  const renderDetail = () => {
    if (loadingGroup) return (
      <div className="dot-pattern min-h-screen" style={{ fontFamily: 'var(--font-nb)' }}>
        {renderHeader(selectedGroup?.title || 'Carregando...', true)}
        <main className="max-w-[600px] mx-auto px-5 py-8">
          <p className="text-on-surface-variant font-bold animate-pulse">Carregando detalhes...</p>
        </main>
      </div>
    );

    if (!selectedGroup) return (
      <div className="dot-pattern min-h-screen" style={{ fontFamily: 'var(--font-nb)' }}>
        {renderHeader('Grupo', true)}
        <main className="max-w-[600px] mx-auto px-5 py-8">
          <p className="text-on-surface-variant font-bold">Grupo não encontrado.</p>
        </main>
      </div>
    );

    return (
      <div className="dot-pattern min-h-screen pb-28" style={{ fontFamily: 'var(--font-nb)' }}>
        {renderHeader(selectedGroup.title, true)}

        <main className="max-w-[600px] mx-auto px-5 py-6 space-y-4">
          {renderAlerts()}

          {/* Info Card */}
          <section className="bg-white border-2 border-[var(--color-nb-ink)] p-4 nb-shadow relative overflow-hidden rounded-none">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Status</p>
                <span className="inline-block px-3 py-1 bg-tertiary-container text-on-tertiary-container border-2 border-[var(--color-nb-ink)] text-xs font-black nb-shadow-sm mt-1">
                  {getDisplayStatus(selectedGroup)}
                </span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Data</p>
                <p className="text-xl font-black text-primary mt-1">{selectedGroup.draw_date || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Orçamento</p>
                <p className="text-xl font-black text-secondary mt-1">
                  {selectedGroup.budget_limit ? `R$ ${selectedGroup.budget_limit}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Dharma Code</p>
                <p className="text-xl font-black text-on-surface font-mono mt-1">{selectedGroup.dharma_code || '—'}</p>
              </div>
            </div>
          </section>

          {/* Link de compartilhamento */}
          {selectedGroup.status === 'open' && selectedGroup.dharma_code && (
            <section className="space-y-2">
              <div className="flex gap-2 items-center">
                <div className="flex-grow">
                  <input
                    readOnly
                    className="nb-input w-full px-4 py-3 text-sm text-on-surface rounded-none"
                    value={`${window.location.origin}/join/${selectedGroup.dharma_code}`}
                  />
                </div>
                <button
                  className="bg-[#25D366] text-white border-2 border-[var(--color-nb-ink)] p-3 nb-shadow hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--color-nb-ink)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_var(--color-nb-ink)] transition-all flex items-center gap-2 font-black text-sm"
                  onClick={() => {
                    const url = `${window.location.origin}/join/${selectedGroup.dharma_code}`;
                    const text = `⚠️ PROTOCOLO DHARMA ATIVADO\n\nNAMASTÊ. VOCÊ FOI SELECIONADO PARA O EXPERIMENTO: "${selectedGroup.title.toUpperCase()}".\n\nACESSE O TERMINAL PARA CONFIRMAR SUA IDENTIDADE:\n${url}\n\n4 8 15 16 23 42`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                >
                  <span className="material-symbols-outlined">share</span>
                  <span className="hidden sm:inline">Compartilhar</span>
                </button>
              </div>
            </section>
          )}

          {/* Contadores */}
          <section className="grid grid-cols-3 gap-2">
            {[
              { label: 'Confirmados', value: statusCounts.confirmed, color: 'text-primary' },
              { label: 'Tokens Env.', value: statusCounts.token_sent, color: 'text-on-surface-variant' },
              { label: 'Revelados',   value: statusCounts.revealed,   color: 'text-on-surface-variant' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface-container-low border-2 border-[var(--color-nb-ink)] p-2 text-center nb-shadow-sm">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] font-bold uppercase leading-tight text-on-surface-variant">{label}</p>
              </div>
            ))}
          </section>

          {/* Formulário de adicionar participante */}
          {selectedGroup.status === 'open' && (
            <section className="bg-surface-container border-2 border-[var(--color-nb-ink)] p-4 nb-shadow space-y-3">
              <h3 className="text-xl font-extrabold text-on-surface">Novo Participante</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  className="nb-input px-4 py-2 rounded-none text-sm text-on-surface"
                  placeholder="Nome"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPendingParticipant()}
                />
                <input
                  className="nb-input px-4 py-2 rounded-none text-sm text-on-surface"
                  placeholder="E-mail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPendingParticipant()}
                />
              </div>
              <button
                className="nb-btn-secondary w-full py-3 rounded-none flex items-center justify-center gap-2"
                onClick={addPendingParticipant}
              >
                <span className="material-symbols-outlined">person_add</span>
                [+] ADICIONAR
              </button>

              {pendingParticipants.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs uppercase font-bold text-on-surface-variant">A convidar:</div>
                  {pendingParticipants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-white border border-[var(--color-nb-ink)] p-2">
                      <span className="text-sm font-semibold text-on-surface">{p.name} ({p.email})</span>
                      <button className="text-error text-xs font-bold hover:underline" onClick={() => removePendingParticipant(p.id)}>REMOVER</button>
                    </div>
                  ))}
                  <button className="nb-btn-secondary w-full py-3 rounded-none mt-2" onClick={handleInvite}>
                    ENVIAR CONVITES ({pendingParticipants.length})
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Lista de participantes */}
          <section className="space-y-3">
            <h3 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined">groups</span>
              Participantes
            </h3>
            <div className="space-y-2">
              {participants.length === 0 && (
                <p className="text-sm text-on-surface-variant font-semibold text-center py-4">Nenhum participante ainda</p>
              )}
              {participants.map((p) => {
                const badge = STATUS_BADGE[p.status] || { bg: 'bg-surface-variant', text: 'text-on-surface-variant' };
                const initials = p.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
                return (
                  <div key={p.id} className="bg-white border-2 border-[var(--color-nb-ink)] p-3 nb-shadow flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-fixed border-2 border-[var(--color-nb-ink)] flex items-center justify-center font-black text-primary text-sm">
                        {initials}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">{p.name}</p>
                        <p className="text-xs text-on-surface-variant">{p.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(p.status === 'invited' || p.status === 'link_clicked') && (
                        <button
                          className="text-xs border border-[var(--color-nb-ink)] px-2 py-0.5 hover:bg-surface-container transition-colors font-bold disabled:opacity-30"
                          onClick={() => handleResendParticipantInvite(p.id)}
                          disabled={isResending}
                        >
                          REENVIAR
                        </button>
                      )}
                      {(p.status === 'token_sent' || p.status === 'revealed') && (
                        <button
                          className="text-xs border border-[var(--color-nb-ink)] px-2 py-0.5 hover:bg-surface-container transition-colors font-bold disabled:opacity-30"
                          onClick={() => handleResendParticipantDraw(p.id)}
                          disabled={isResending}
                        >
                          REENVIAR SORTEIO
                        </button>
                      )}
                      <span className={`${badge.bg} ${badge.text} border-2 border-[var(--color-nb-ink)] px-2 py-0.5 text-[10px] font-black nb-shadow-sm`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                      <button
                        className="text-error hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteParticipant(p.id)}
                        title="Remover"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>

        {/* Botão de sorteio sticky */}
        {selectedGroup.status === 'open' && (
          <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-sm border-t-2 border-[var(--color-nb-ink)] z-40">
            <div className="max-w-[600px] mx-auto">
              <button
                className={`nb-btn-primary w-full py-5 rounded-none text-xl flex items-center justify-center gap-4 ${!canDraw ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleDraw}
                disabled={!canDraw}
              >
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                {drawLabel}
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
              </button>
            </div>
          </div>
        )}

        {drawResult && (
          <div className="max-w-[600px] mx-auto px-5 pb-4">
            <p className="text-xs text-on-surface-variant font-semibold">
              Emails enviados: {drawResult.sent?.length || 0} · Falhas: {drawResult.failed?.length || 0}
            </p>
          </div>
        )}

        {/* Modal de processamento */}
        {(isSending || isDrawing) && (
          <div className="fixed inset-0 bg-[var(--color-nb-ink)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-[var(--color-nb-ink)] rounded-xl p-8 max-w-md w-full shadow-[12px_12px_0px_0px_var(--color-nb-ink)] space-y-6 text-center" style={{ fontFamily: 'var(--font-nb)' }}>
              <div className="space-y-3">
                <span className="material-symbols-outlined text-5xl text-secondary-container animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {sendingSuccess || drawSuccess ? 'celebration' : 'autorenew'}
                </span>
                <p className="text-xl font-black text-on-surface">
                  {isSending ? (
                    sendingSuccess ? 'CONVITES ENVIADOS!' : `ENVIANDO MENSAGENS${dots}`
                  ) : (
                    drawSuccess ? 'SORTEIO REALIZADO!' : (
                      drawStep === 0 ? `RANDOMIZANDO DADOS${dots}` :
                        drawStep === 1 ? `GERANDO CHAVES${dots}` :
                          drawStep === 2 ? `CRIPTOGRAFANDO${dots}` :
                            `ENVIANDO TOKENS${dots}`
                    )
                  )}
                </p>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden border border-[var(--color-nb-ink)]">
                  <div className={`h-full bg-primary transition-all duration-500 ${(sendingSuccess || drawSuccess) ? 'w-full' : 'w-2/3 animate-pulse'}`}></div>
                </div>
              </div>

              {(sendingSuccess || drawSuccess) ? (
                <div className="space-y-4">
                  <div className="bg-secondary-container/20 p-3 border-2 border-[var(--color-nb-ink)] rounded-xl">
                    <p className="text-sm font-bold text-on-secondary-container">⚠️ Cheque o spam:</p>
                    <p className="text-xs font-semibold text-on-surface">amigo.secreto@mercadocompleto.com.br</p>
                  </div>
                  <button
                    className="nb-btn-secondary w-full py-3 rounded-xl"
                    onClick={() => {
                      setIsSending(false);
                      setSendingSuccess(false);
                      setIsDrawing(false);
                      setDrawSuccess(false);
                    }}
                  >
                    FECHAR
                  </button>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant font-semibold animate-pulse">
                  Aguarde enquanto o sorteio é processado...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {view === 'list' && renderList()}
      {view === 'create' && renderCreate()}
      {view === 'detail' && renderDetail()}
    </>
  );
}
