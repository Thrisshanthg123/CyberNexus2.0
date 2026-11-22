import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, ExternalLink } from 'lucide-react';
import { Panel, Badge, Button, Drawer, Tooltip } from '../../components/ui';
import { useAsync } from '../../hooks';
import { api } from '../../services/api';
import { Campaign } from '../../types';

export const CampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const campaignsAsync = useAsync(() => api.getCampaigns());
  const campaigns = campaignsAsync.data || [];

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Adversary Campaigns & Threat Operations</h1>
            <Badge variant="simulated">Simulated data</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            High-level multi-threat correlation tracking sophisticated nation-state and cybercrime campaigns.
          </p>
        </div>

        {/* Module Status: Planned label instead of permanently disabled button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Tooltip content="Campaign correlation engine is not built yet.">
            <div className="ui-planned-chip-container">
              <Badge variant="planned">Campaign detection not built yet</Badge>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Campaign Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
        {campaigns.map(camp => (
          <Panel
            key={camp.id}
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Boxes size={18} color="var(--accent-cyan)" />
                {camp.name}
              </span>
            }
            action={
              <Badge variant={camp.status === 'Active' ? 'critical' : camp.status === 'Dormant' ? 'high' : 'low'}>
                {camp.status.toUpperCase()}
              </Badge>
            }
            style={{ cursor: 'pointer' }}
            tabIndex={0}
            role="button"
            aria-label={`Inspect campaign ${camp.name}`}
            onClick={() => setSelectedCampaign(camp)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedCampaign(camp);
              }
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                Actor: <strong style={{ color: 'var(--accent-cyan)' }}>{camp.actor}</strong> • ID: {camp.id}
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-small)', textTransform: 'uppercase' }}>Target Sectors:</span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {camp.targetSectors.map(sec => (
                    <span key={sec} style={{ background: 'var(--color-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-chip)', padding: '2px 6px', fontSize: '11px', color: 'var(--color-text)' }}>
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-small)' }}>
                <span>Linked Threats: <strong>{camp.threatIds.length}</strong></span>
                <span>Active: <strong>{new Date(camp.lastSeen).toLocaleDateString()}</strong></span>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {/* Campaign Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedCampaign)}
        onClose={() => setSelectedCampaign(null)}
        title={
          selectedCampaign && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span>{selectedCampaign.name}</span>
              <Badge variant="critical">{selectedCampaign.severity}</Badge>
            </div>
          )
        }
      >
        {selectedCampaign && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', textTransform: 'uppercase', marginBottom: '2px' }}>
                Threat Actor Attribution
              </div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                {selectedCampaign.actor}
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                ID: {selectedCampaign.id} • Status: {selectedCampaign.status}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Operational MITRE TTPs
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {selectedCampaign.ttps.map(ttp => (
                  <div key={ttp} style={{ background: 'var(--color-raised)', padding: 'var(--space-2)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)' }}>
                    {ttp}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Linked Threat Dossiers ({selectedCampaign.threatIds.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {selectedCampaign.threatIds.map(tid => (
                  <div
                    key={tid}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--color-raised)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-chip)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>
                      {tid}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/dashboard/threats/${tid}`)}
                      style={{ minHeight: '26px', padding: '2px 8px', fontSize: '11px' }}
                      icon={<ExternalLink size={12} />}
                    >
                      Inspect
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
