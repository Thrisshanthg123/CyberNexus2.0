import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Panel, Badge, Button, Modal } from '../../components/ui';
import { investigationStore, InvestigationCase } from '../../services/investigationStore';

export const InvestigationPage: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<InvestigationCase[]>(investigationStore.getCases());
  const [activeCaseId, setActiveCaseId] = useState<string>(cases[0]?.id || '');
  const [newCaseModalOpen, setNewCaseModalOpen] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newNoteText, setNewNoteText] = useState('');

  useEffect(() => {
    return investigationStore.subscribe(() => {
      setCases(investigationStore.getCases());
    });
  }, []);

  const activeCase = cases.find(c => c.id === activeCaseId) || cases[0];

  const handleCreateCase = () => {
    if (!newCaseTitle.trim()) return;
    const created = investigationStore.createNewCase(newCaseTitle);
    setActiveCaseId(created.id);
    setNewCaseTitle('');
    setNewCaseModalOpen(false);
  };

  const handleAddNote = () => {
    if (!newNoteText.trim() || !activeCase) return;
    investigationStore.addNote(activeCase.id, newNoteText);
    setNewNoteText('');
  };

  const handleRemoveThreat = (threatId: string) => {
    if (!activeCase) return;
    investigationStore.removeThreatFromCase(activeCase.id, threatId);
  };

  const handleStatusChange = (status: 'Open' | 'Under Review' | 'Closed') => {
    if (!activeCase) return;
    investigationStore.updateStatus(activeCase.id, status);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Incident Investigation Workspace</h1>
            <Badge variant="simulated">In-memory state (session only)</Badge>
          </div>
          <p style={{ color: 'var(--color-text-small)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Collaborative case management for correlating multi-stage incidents, taking analyst notes, and triaging indicators.
          </p>
        </div>

        <div>
          <Button
            variant="primary"
            onClick={() => setNewCaseModalOpen(true)}
            icon={<Plus size={14} />}
          >
            Create New Case
          </Button>
        </div>
      </div>

      {/* Case Management Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Cases Sidebar list */}
        <Panel title="Active Case Files">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {cases.map(c => {
              const isSelected = c.id === activeCase?.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveCaseId(c.id)}
                  style={{
                    padding: 'var(--space-3)',
                    background: isSelected ? 'var(--color-raised)' : 'transparent',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--color-border)',
                    borderRadius: 'var(--radius-chip)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: isSelected ? 'var(--accent-cyan)' : 'var(--color-text-small)' }}>
                      {c.id}
                    </span>
                    <Badge variant={c.status === 'Open' ? 'critical' : c.status === 'Under Review' ? 'high' : 'low'}>
                      {c.status}
                    </Badge>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {c.threats.length} threats • {c.notes.length} notes
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Selected Case Workspace Details */}
        {activeCase ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', gridColumn: 'span 2' }}>
            <Panel
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span>{activeCase.title}</span>
                  <Badge variant={activeCase.status === 'Open' ? 'critical' : 'high'}>{activeCase.status}</Badge>
                </div>
              }
              action={
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button
                    variant={activeCase.status === 'Open' ? 'primary' : 'outline'}
                    onClick={() => handleStatusChange('Open')}
                    style={{ minHeight: '26px', padding: '2px 8px', fontSize: '11px' }}
                  >
                    Open
                  </Button>
                  <Button
                    variant={activeCase.status === 'Under Review' ? 'primary' : 'outline'}
                    onClick={() => handleStatusChange('Under Review')}
                    style={{ minHeight: '26px', padding: '2px 8px', fontSize: '11px' }}
                  >
                    Review
                  </Button>
                  <Button
                    variant={activeCase.status === 'Closed' ? 'primary' : 'outline'}
                    onClick={() => handleStatusChange('Closed')}
                    style={{ minHeight: '26px', padding: '2px 8px', fontSize: '11px' }}
                  >
                    Close
                  </Button>
                </div>
              }
            >
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-3)' }}>
                Case ID: {activeCase.id} • Created: {new Date(activeCase.createdAt).toLocaleString()} • Updated: {new Date(activeCase.updatedAt).toLocaleTimeString()}
              </div>

              {/* Linked Threats */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  Correlated Case Threats ({activeCase.threats.length})
                </h4>
                {activeCase.threats.length === 0 ? (
                  <div style={{ background: 'var(--color-raised)', padding: 'var(--space-4)', borderRadius: 'var(--radius-chip)', border: '1px dashed var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', textAlign: 'center' }}>
                    No threats linked yet. Add threats directly from Live Feed, Overview, or Threat Details pages.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {activeCase.threats.map(threat => (
                      <div
                        key={threat.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'var(--color-raised)',
                          padding: 'var(--space-3)',
                          borderRadius: 'var(--radius-chip)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <Badge variant={threat.severity}>{threat.severity}</Badge>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>
                              {threat.title}
                            </span>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                              {threat.id} • {threat.cveId}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/dashboard/threats/${threat.id}`)}
                            style={{ minHeight: '26px', padding: '2px 6px', fontSize: '11px' }}
                            icon={<ExternalLink size={12} />}
                          >
                            Inspect
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleRemoveThreat(threat.id)}
                            style={{ minHeight: '26px', padding: '2px 6px', fontSize: '11px' }}
                            icon={<Trash2 size={12} />}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Analyst Notes */}
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  Analyst Working Notes
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  {activeCase.notes.map((note, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--color-base)',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-chip)',
                        border: '1px solid var(--color-border)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text)'
                      }}
                    >
                      {note}
                    </div>
                  ))}
                </div>

                {/* Add Note Input */}
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input
                    type="text"
                    placeholder="Add an investigation finding or analyst note..."
                    value={newNoteText}
                    onChange={e => setNewNoteText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNote();
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--color-raised)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-chip)',
                      padding: 'var(--space-2) var(--space-3)',
                      color: 'var(--color-text)',
                      fontSize: 'var(--text-xs)',
                      outline: 'none'
                    }}
                  />
                  <Button variant="secondary" onClick={handleAddNote} style={{ fontSize: 'var(--text-xs)' }}>
                    Add Note
                  </Button>
                </div>
              </div>
            </Panel>
          </div>
        ) : null}
      </div>

      {/* Modal for creating a new case */}
      <Modal
        isOpen={newCaseModalOpen}
        onClose={() => setNewCaseModalOpen(false)}
        title="Initialize New Investigation Case"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', marginBottom: '4px' }}>
              Case Title / Incident Scope
            </label>
            <input
              autoFocus
              type="text"
              placeholder="e.g., Targeted Zero-Day Phishing Campaign Investigation"
              value={newCaseTitle}
              onChange={e => setNewCaseTitle(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--color-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-chip)',
                padding: 'var(--space-2) var(--space-3)',
                color: 'var(--color-text)',
                fontSize: 'var(--text-sm)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="outline" onClick={() => setNewCaseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateCase} disabled={!newCaseTitle.trim()}>
              Create Case File
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
