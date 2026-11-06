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

/**
 * Tela de detalhe de um grupo (status, contadores, participantes).
 * Compartilhada entre AdminDashboard (gerenciamento completo) e
 * ParticipantDashboard (readOnly=true, sem nenhum CTA de gerenciamento).
 */
export default function GroupDetailView({
  group,
  participants,
  statusCounts,
  displayStatus,
  readOnly = false,
  // Props abaixo só são usadas quando readOnly === false.
  pendingParticipants = [],
  inviteName = '',
  inviteEmail = '',
  setInviteName,
  setInviteEmail,
  addPendingParticipant,
  removePendingParticipant,
  handleInvite,
  handleResendParticipantInvite,
  handleResendParticipantDraw,
  handleDeleteParticipant,
  isResending = false,
  handleDraw,
  canDraw = false,
  drawLabel = '',
  drawResult = null,
}) {
  return (
    <div className="space-y-4 pb-28">
      {/* Info Card */}
      <section className="bg-white border-2 border-[var(--color-nb-ink)] p-4 nb-shadow relative overflow-hidden rounded-none">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Status</p>
            <span className="inline-block px-3 py-1 bg-tertiary-container text-on-tertiary-container border-2 border-[var(--color-nb-ink)] text-xs font-black nb-shadow-sm mt-1">
              {displayStatus}
            </span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Data</p>
            <p className="text-xl font-black text-primary mt-1">{group.draw_date || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Orçamento</p>
            <p className="text-xl font-black text-secondary mt-1">
              {group.budget_limit ? `R$ ${group.budget_limit}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Dharma Code</p>
            <p className="text-xl font-black text-on-surface font-mono mt-1">{group.dharma_code || '—'}</p>
          </div>
        </div>
      </section>

      {/* Link de compartilhamento */}
      {!readOnly && group.status === 'open' && group.dharma_code && (
        <section className="space-y-2">
          <div className="flex gap-2 items-center">
            <div className="flex-grow">
              <input
                readOnly
                className="nb-input w-full px-4 py-3 text-sm text-on-surface rounded-none"
                value={`${window.location.origin}/join/${group.dharma_code}`}
              />
            </div>
            <button
              className="bg-[#25D366] text-white border-2 border-[var(--color-nb-ink)] p-3 nb-shadow hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--color-nb-ink)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_var(--color-nb-ink)] transition-all flex items-center gap-2 font-black text-sm"
              onClick={() => {
                const url = `${window.location.origin}/join/${group.dharma_code}`;
                const text = `🎁 Você foi convidado para o Amigo Secreto "${group.title}"!\n\nBora trocar presentes (e carinho)? Clique no link para confirmar sua participação:\n${url}`;
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
      {!readOnly && group.status === 'open' && (
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
                  {!readOnly && (p.status === 'invited' || p.status === 'link_clicked') && (
                    <button
                      className="text-xs border border-[var(--color-nb-ink)] px-2 py-0.5 hover:bg-surface-container transition-colors font-bold disabled:opacity-30"
                      onClick={() => handleResendParticipantInvite(p.id)}
                      disabled={isResending}
                    >
                      REENVIAR
                    </button>
                  )}
                  {!readOnly && (p.status === 'token_sent' || p.status === 'revealed') && (
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
                  {!readOnly && (
                    <button
                      className="text-error hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeleteParticipant(p.id)}
                      title="Remover"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Botão de sorteio sticky */}
      {!readOnly && group.status === 'open' && (
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

      {!readOnly && drawResult && (
        <div className="max-w-[600px] mx-auto px-5 pb-4">
          <p className="text-xs text-on-surface-variant font-semibold">
            Emails enviados: {drawResult.sent?.length || 0} · Falhas: {drawResult.failed?.length || 0}
          </p>
        </div>
      )}
    </div>
  );
}
