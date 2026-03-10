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

    // Contagem de tokens e revelações
    let tokenSent = 0;
    let revealed = 0;
    if (group.id === selectedGroup?.id) {
      tokenSent = statusCounts.token_sent;
      revealed = statusCounts.revealed;
    } else {
      tokenSent = parseInt(group.token_sent_count || 0);
      revealed = parseInt(group.revealed_count || 0);
    }

    // Status FECHADO: 
    // 1. Todos revelaram (se sorteado)
    if (isDrawn && revealed > 0 && tokenSent === 0) {
      return 'FECHADO';
    }

    // 2. Data do evento passou (se não foi sorteado ainda ou se já foi concluído)
    if (group.draw_date) {
      const dateStr = group.draw_date.includes(' ') ? group.draw_date.replace(' ', 'T') : group.draw_date;
      const eventDate = new Date(dateStr);
      if (!isNaN(eventDate.getTime()) && new Date() < new Date()) {
        // Se ainda estiver "aberto" e passou a data, fecha.
        // Se estiver sorteado mas com pendência, mantemos sorteado até o fim das revelações ou decisão do admin.
        if (group.status === 'open') return 'FECHADO';
      }
    }

    const map = {
      'open': 'ABERTO - aguardando participacao',
      'drawn': 'SORTEADO - tokens enviados',
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
          <div
            key={group.id}
            className="w-full flex items-stretch border border-crt-green/20 hover:border-crt-green/50 transition-colors group relative"
          >
            <button
              className="flex-grow text-left p-4"
              onClick={() => {
                setSelectedGroupId(group.id);
                setView('detail');
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm group-hover:text-crt-green-bright transition-colors uppercase tracking-wider">{group.title}</div>
                  <div className="text-[10px] opacity-60 mt-1 uppercase">
                    {group.status === 'drawn' ? (
                      `${group.revealed_count || 0}/${parseInt(group.revealed_count || 0) + parseInt(group.token_sent_count || 0)} SEGREDO REVELADO`
                    ) : (
                      `${group.confirmed_count || 0}/${group.total_participants || 0} PARTICIPANTES CONFIRMADOS`
                    )}
                  </div>
                </div>
                <div className="text-[9px] border border-crt-green px-2 py-0.5 uppercase">
                  {getDisplayStatus(group)}
                </div>
              </div>
            </button>
            <button
              className="px-4 border-l border-crt-green/20 bg-crt-red/5 text-crt-red hover:bg-crt-red/20 transition-colors text-[10px] items-center justify-center flex"
              title="Deletar Grupo"
              onClick={(e) => handleDeleteGroup(e, group.id)}
            >
              [X]
            </button>
          </div>
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
            placeholder="Data do evento (ex: 25/11/2026 10:30)"
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
      <div className="space-y-8 pb-12">
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
            <div className="text-xs text-crt-green uppercase font-bold">{getDisplayStatus(selectedGroup)}</div>
          </div>
        </div>

        {selectedGroup.draw_date && (
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-[10px] opacity-80 border-l-2 border-crt-green pl-2 uppercase">
              Evento em: <span className="text-crt-green">{selectedGroup.draw_date}</span>
            </div>
            {selectedGroup.dharma_code && (
              <div className="text-[10px] opacity-80 border-l-2 border-crt-green pl-2 uppercase">
                DH_CODE: <span className="text-crt-green font-bold">{selectedGroup.dharma_code}</span>
              </div>
            )}
          </div>
        )}

        {selectedGroup.status === 'open' && selectedGroup.dharma_code && (
          <div className="bg-crt-green/5 border border-crt-green/20 p-4 space-y-3">
            <div className="text-[9px] tracking-[0.2em] uppercase opacity-60">Link de Auto-Inscrição (WhatsApp):</div>
            <div className="flex items-center gap-3">
              <input
                readOnly
                className="crt-input flex-grow p-2 text-[10px] opacity-70"
                value={`${window.location.origin}/join/${selectedGroup.dharma_code}`}
              />
              <button
                className="crt-btn-sm bg-green-900/40 border-green-500/50 text-green-400 hover:bg-green-800/60"
                onClick={() => {
                  const url = `${window.location.origin}/join/${selectedGroup.dharma_code}`;
                  const text = `Namaste! Voce foi selecionado para o Amigo Secreto "${selectedGroup.title}". Acesse o terminal para participar: ${url}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
              >
                WHATSAPP
              </button>
            </div>
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
                      <button
                        className="text-crt-red text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:underline"
                        onClick={() => handleDeleteParticipant(p.id)}
                        title="Remover Participante"
                      >
                        [REMOVER]
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      {(p.status === 'invited' || p.status === 'link_clicked') && (
                        <button
                          className="text-[9px] border border-crt-green/30 px-2 py-0.5 hover:bg-crt-green/10 transition-colors disabled:opacity-30"
                          onClick={() => handleResendParticipantInvite(p.id)}
                          disabled={isResending}
                        >
                          REENVIAR CONVITE
                        </button>
                      )}
                      {(p.status === 'token_sent' || p.status === 'revealed') && (
                        <button
                          className="text-[9px] border border-crt-green/30 px-2 py-0.5 hover:bg-crt-green/10 transition-colors disabled:opacity-30"
                          onClick={() => handleResendParticipantDraw(p.id)}
                          disabled={isResending}
                        >
                          REENVIAR SORTEIO
                        </button>
                      )}
                      <span className="text-[9px] uppercase tracking-wider font-bold text-crt-green opacity-70 ml-2">
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </div>
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
          <div className="space-y-6 pt-4 border-t border-crt-green/10">
            <div className="space-y-4">
              <div className="text-[10px] tracking-[0.3em] uppercase opacity-60">Adicionar participante</div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
                <input
                  className="crt-input p-2 text-xs"
                  placeholder="Nome do participante"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPendingParticipant()}
                />
                <input
                  className="crt-input p-2 text-xs"
                  placeholder="E-mail"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPendingParticipant()}
                />
                <button className="crt-btn text-xs px-4" onClick={addPendingParticipant}>[+] ADICIONAR</button>
              </div>

              {pendingParticipants.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase opacity-60 font-medium">Novos participantes a serem convidados:</div>
                  <div className="border border-crt-green/20">
                    {pendingParticipants.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 border-b border-crt-green/10 last:border-0 hover:bg-crt-green/5">
                        <span className="text-xs opacity-80">{p.name} ({p.email})</span>
                        <button className="text-crt-red text-[10px] hover:underline" onClick={() => removePendingParticipant(p.id)}>[REMOVER]</button>
                      </div>
                    ))}
                  </div>
                  <button className="crt-btn w-full py-3 mt-4 text-sm font-bold shadow-[0_0_15px_rgba(57,255,132,0.2)]" onClick={handleInvite}>
                    ENVIAR CONVITES ({pendingParticipants.length})
                  </button>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-crt-green/10">
              <div className="text-[10px] tracking-[0.3em] uppercase opacity-60 mb-3">Sorteio</div>
              <button
                className={`crt-btn w-full py-4 text-sm ${!canDraw ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                type="button"
                onClick={handleDraw}
                disabled={!canDraw}
              >
                {drawLabel}
              </button>
              {drawResult && (
                <div className="text-[9px] opacity-60 uppercase bg-crt-green/5 p-2 mt-2">
                  Emails: {drawResult.sent?.length || 0} / Falhas: {drawResult.failed?.length || 0}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Processamento (Convites ou Sorteio) */}
        {(isSending || isDrawing) && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="crt-panel max-w-md w-full border border-crt-green shadow-[0_0_50px_rgba(57,255,132,0.1)] p-8 space-y-6 text-center">
              <div className="space-y-3">
                <p className="text-crt-green text-sm tracking-[0.2em] font-bold uppercase transition-all duration-300">
                  {isSending ? (
                    sendingSuccess ? 'CONVITES ENVIADOS COM SUCESSO!' : `ENVIANDO MENSAGENS${dots}`
                  ) : (
                    drawSuccess ? 'SORTEIO REALIZADO COM SUCESSO!' : (
                      drawStep === 0 ? `RANDOMIZANDO DADOS${dots}` :
                        drawStep === 1 ? `GERANDO CHAVES DE SEGURANÇA${dots}` :
                          drawStep === 2 ? `CRIPTOGRAFANDO RESULTADOS${dots}` :
                            `ENVIANDO TOKENS POR E-MAIL${dots}`
                    )
                  )}
                </p>
                <div className="h-1 w-full bg-crt-green/10 overflow-hidden">
                  <div className={`h-full bg-crt-green transition-all duration-500 ${(sendingSuccess || drawSuccess) ? 'w-full' : 'animate-pulse w-2/3'}`}></div>
                </div>
              </div>

              {(sendingSuccess || drawSuccess) ? (
                <div className="space-y-4">
                  <p className="text-[11px] uppercase leading-relaxed text-crt-green/80">
                    {sendingSuccess ? 'Os participantes foram notificados via e-mail!' : 'O sorteio foi realizado e os tokens foram enviados!'}
                  </p>
                  <div className="bg-crt-green/5 p-3 border border-crt-green/20">
                    <p className="text-[10px] uppercase text-crt-green-bright font-bold mb-1">Atenção ao Spam:</p>
                    <p className="text-[9px] uppercase opacity-70">
                      Peça para verificarem a caixa de spam pelo remetente:<br />
                      <span className="text-white">amigo.secreto@mercadocompleto.com.br</span>
                    </p>
                  </div>
                  <button className="crt-btn w-full py-2 text-xs" onClick={() => {
                    setIsSending(false);
                    setSendingSuccess(false);
                    setIsDrawing(false);
                    setDrawSuccess(false);
                  }}>
                    FECHAR
                  </button>
                </div>
              ) : (
                <p className="text-[10px] opacity-60 uppercase animate-pulse">
                  Por favor, aguarde enquanto o protocolo DHARMA é executado...
                </p>
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
        <div className="space-y-1">
          <div className="text-[9px] tracking-[0.2em] uppercase opacity-40">
            SYSTEM_ACCESS: {admin.email}
          </div>
          <div className="text-[7px] tracking-[0.4em] uppercase opacity-20 font-bold">
            DHARMA INITIATIVE — STATION 3: THE SWAN
          </div>
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
      {notice && !isSending && (
        <div className="bg-crt-green/5 border border-crt-green/30 p-2">
          <p className="text-[10px] tracking-wider uppercase text-crt-green">
            SYSTEM_MSG: {notice}
          </p>
        </div>
      )}

      {view === 'list' && renderList()}
      {view === 'create' && renderCreate()}
      {view === 'detail' && renderDetail()}

      <div className="pt-8 mt-8 border-t border-crt-green/5 flex justify-center">
        <div className="text-[8px] tracking-[1em] uppercase opacity-10 hover:opacity-30 transition-opacity cursor-default">
          4 8 15 16 23 42
        </div>
      </div>
    </div>
  );
}


