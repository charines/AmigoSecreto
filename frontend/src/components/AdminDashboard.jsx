import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import GroupDetailView from './GroupDetailView';

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
      const data = await apiGet('/api/groups?action=list');
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
      const data = await apiGet(`/api/groups?action=detail&id=${groupId}`);
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
      let formattedBudget = groupForm.budget_limit.trim();
      if (formattedBudget) {
        const num = parseFloat(formattedBudget.replace(/\./g, '').replace(',', '.'));
        if (!isNaN(num)) {
          formattedBudget = num.toFixed(2);
        }
      }

      let formattedDate = groupForm.draw_date;
      if (formattedDate && formattedDate.includes('T')) {
        formattedDate = formattedDate.replace('T', ' ') + ':00';
      }

      const payload = {
        title: groupForm.title.trim(),
        description: groupForm.description.trim(),
        draw_date: formattedDate,
        budget_limit: formattedBudget,
      };
      const data = await apiPost('/api/groups?action=create', payload);
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
      const data = await apiPost('/api/groups?action=invite', {
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
      const data = await apiPost('/api/groups_draw', { group_id: selectedGroupId });
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
      await apiPost('/api/groups?action=delete', { group_id: groupId });
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
      await apiPost('/api/participants?action=resend_invite', { participant_id: participantId });
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
      await apiPost('/api/participants?action=resend_draw', { participant_id: participantId });
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
      await apiPost('/api/participants?action=delete', { participant_id: participantId });
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
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-on-surface uppercase tracking-wider pl-1">
              Data do Evento
            </label>
            <input
              className="nb-input w-full p-3 rounded-xl text-sm text-on-surface"
              style={{ fontFamily: 'var(--font-nb)' }}
              type="datetime-local"
              value={groupForm.draw_date}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, draw_date: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-on-surface uppercase tracking-wider pl-1">
              Orçamento (Opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant font-bold">R$</span>
              <input
                className="nb-input w-full p-3 pl-9 rounded-xl text-sm text-on-surface"
                style={{ fontFamily: 'var(--font-nb)' }}
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={groupForm.budget_limit}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (!value) {
                    setGroupForm((prev) => ({ ...prev, budget_limit: '' }));
                    return;
                  }
                  const floatValue = parseFloat(value) / 100;
                  const formatted = new Intl.NumberFormat('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(floatValue);
                  setGroupForm((prev) => ({ ...prev, budget_limit: formatted }));
                }}
              />
            </div>
          </div>
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

          <GroupDetailView
            group={selectedGroup}
            participants={participants}
            statusCounts={statusCounts}
            displayStatus={getDisplayStatus(selectedGroup)}
            readOnly={false}
            pendingParticipants={pendingParticipants}
            inviteName={inviteName}
            inviteEmail={inviteEmail}
            setInviteName={setInviteName}
            setInviteEmail={setInviteEmail}
            addPendingParticipant={addPendingParticipant}
            removePendingParticipant={removePendingParticipant}
            handleInvite={handleInvite}
            handleResendParticipantInvite={handleResendParticipantInvite}
            handleResendParticipantDraw={handleResendParticipantDraw}
            handleDeleteParticipant={handleDeleteParticipant}
            isResending={isResending}
            handleDraw={handleDraw}
            canDraw={canDraw}
            drawLabel={drawLabel}
            drawResult={drawResult}
          />
        </main>

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
