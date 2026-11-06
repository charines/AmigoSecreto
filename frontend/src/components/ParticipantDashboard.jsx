import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import GroupDetailView from './GroupDetailView';

const STATUS_MAP = {
  open: 'ABERTO',
  drawn: 'SORTEADO',
  cancelled: 'CANCELADO',
};

export default function ParticipantDashboard({ participant, onLogout }) {
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupParticipants, setGroupParticipants] = useState([]);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [detailError, setDetailError] = useState('');

  const statusCounts = useMemo(() => {
    const counts = { invited: 0, link_clicked: 0, confirmed: 0, token_sent: 0, revealed: 0 };
    groupParticipants.forEach((p) => {
      if (counts[p.status] !== undefined) counts[p.status] += 1;
    });
    return counts;
  }, [groupParticipants]);

  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiGet('/api/participant?action=groups');
        setGroups(data.groups || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, []);

  useEffect(() => {
    if (view !== 'detail' || !selectedGroupId) return;
    const loadDetail = async () => {
      setLoadingGroup(true);
      setDetailError('');
      try {
        const data = await apiGet(`/api/participant?action=group_detail&id=${selectedGroupId}`);
        setSelectedGroup(data.group);
        setGroupParticipants(data.participants || []);
      } catch (err) {
        setDetailError(err.message);
      } finally {
        setLoadingGroup(false);
      }
    };
    loadDetail();
  }, [view, selectedGroupId]);

  const handleLogout = async () => {
    try {
      await apiPost('/api/participant?action=logout', {});
    } catch {
      // ignore
    } finally {
      onLogout();
    }
  };

  const openGroup = (groupId) => {
    setSelectedGroupId(groupId);
    setSelectedGroup(null);
    setGroupParticipants([]);
    setView('detail');
  };

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
          onClick={handleLogout}
        >
          SAIR
        </button>
        <div className="w-10 h-10 rounded-full border-2 border-[var(--color-nb-ink)] bg-secondary-container overflow-hidden nb-shadow-sm flex items-center justify-center">
          <span className="text-xs font-black text-on-secondary-container">
            {participant.email?.[0]?.toUpperCase() || 'P'}
          </span>
        </div>
      </div>
    </header>
  );

  if (view === 'detail') {
    return (
      <div className="dot-pattern min-h-screen pb-28" style={{ fontFamily: 'var(--font-nb)' }}>
        {renderHeader(selectedGroup?.title || 'Grupo', true)}
        <main className="max-w-[600px] mx-auto px-5 py-6 space-y-4">
          {detailError && (
            <div className="bg-error-container border-2 border-error rounded-xl p-3 nb-shadow-sm">
              <p className="text-on-error-container text-sm font-bold">✖ {detailError}</p>
            </div>
          )}
          {loadingGroup && (
            <p className="text-on-surface-variant font-bold animate-pulse">Carregando detalhes...</p>
          )}
          {!loadingGroup && selectedGroup && (
            <GroupDetailView
              group={selectedGroup}
              participants={groupParticipants}
              statusCounts={statusCounts}
              displayStatus={STATUS_MAP[selectedGroup.status] || selectedGroup.status.toUpperCase()}
              readOnly
            />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="star-pattern min-h-screen" style={{ fontFamily: 'var(--font-nb)' }}>
      {renderHeader('AmigoSecreto')}

      <main className="max-w-4xl mx-auto px-5 py-10 space-y-6">
        <div>
          <h2 className="text-[2rem] leading-tight font-black text-on-surface">Meus Grupos</h2>
          <div className="h-1 w-24 bg-primary border-2 border-[var(--color-nb-ink)] rounded-full mt-1"></div>
        </div>
        {error && (
          <div className="bg-error-container border-2 border-error rounded-xl p-3 nb-shadow-sm">
            <p className="text-on-error-container text-sm font-bold">✖ {error}</p>
          </div>
        )}

        {loading && (
          <p className="text-on-surface-variant font-bold text-sm animate-pulse">Carregando grupos...</p>
        )}

        {!loading && !error && groups.length === 0 && (
          <p className="text-on-surface-variant font-semibold text-sm">
            Você ainda não participa de nenhum grupo com o e-mail {participant.email}.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => {
            const isDrawn = group.status === 'drawn';
            return (
              <div
                key={group.id}
                className="nb-card p-6 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--color-nb-ink)] transition-all"
              >
                <div className="flex flex-col gap-2 mb-3">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border-2 border-[var(--color-nb-ink)] w-fit tracking-tighter ${
                    isDrawn ? 'bg-secondary-container text-on-secondary-container' : 'bg-[#22c55e] text-white'
                  }`}>
                    {isDrawn ? 'SORTEADO' : 'ABERTO'}
                  </span>
                  <h3 className="text-xl font-extrabold text-on-surface">{group.title}</h3>
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
                  <button className="nb-btn-secondary px-4 py-1 rounded-lg text-sm" onClick={() => openGroup(group.id)}>
                    VER
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
