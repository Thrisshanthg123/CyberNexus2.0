import React, { useState, useMemo } from 'react';
import {
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  Download,
  CheckSquare,
  Square
} from 'lucide-react';
import { Panel, Badge, Button } from '../../components/ui';
import { useAsync } from '../../hooks';
import { api } from '../../services/api';

export const IocExplorerPage: React.FC = () => {
  const iocsAsync = useAsync(() => api.getIOCs());
  const iocs = iocsAsync.data || [];

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredIocs = useMemo(() => {
    return iocs.filter(ioc => {
      const matchType = typeFilter === 'all' || ioc.type === typeFilter;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !searchQuery ||
        ioc.value.toLowerCase().includes(q) ||
        ioc.defangedValue.toLowerCase().includes(q) ||
        ioc.id.toLowerCase().includes(q) ||
        ioc.threatId.toLowerCase().includes(q);
      return matchType && matchQuery;
    });
  }, [iocs, typeFilter, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredIocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIocs.map(i => i.id)));
    }
  };

  const handleCopy = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportSelected = (format: 'json' | 'csv') => {
    const itemsToExport = filteredIocs.filter(i => selectedIds.has(i.id));
    if (itemsToExport.length === 0) return;

    let content = '';
    let mime = '';
    let filename = `cybernexus_iocs_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'json') {
      content = JSON.stringify(itemsToExport, null, 2);
      mime = 'application/json';
      filename += '.json';
    } else {
      content = 'ID,ThreatID,Type,Value,Reputation,FirstSeen,LastSeen\n' +
        itemsToExport.map(i => `"${i.id}","${i.threatId}","${i.type}","${isRevealed ? i.value : i.defangedValue}","${i.reputation}","${i.firstSeen}","${i.lastSeen}"`).join('\n');
      mime = 'text/csv';
      filename += '.csv';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Indicators of Compromise (IOC) Explorer</h1>
            <Badge variant="simulated">Simulated data</Badge>
          </div>
          <p style={{ color: 'var(--color-text-small)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Defanged threat observables across IPs, malicious domains, C2 hashes, and weaponized CVE triggers.
          </p>
        </div>

        {/* Global Controls: Reveal raw toggle & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button
            variant={isRevealed ? 'danger' : 'outline'}
            onClick={() => setIsRevealed(prev => !prev)}
            icon={isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
          >
            {isRevealed ? 'Raw IOCs Active (Dangerous)' : 'Defanged (Safe Mode)'}
          </Button>

          <Button
            variant="outline"
            disabled={selectedIds.size === 0}
            onClick={() => exportSelected('csv')}
            icon={<Download size={14} />}
          >
            Export CSV ({selectedIds.size})
          </Button>
          <Button
            variant="outline"
            disabled={selectedIds.size === 0}
            onClick={() => exportSelected('json')}
            icon={<Download size={14} />}
          >
            Export JSON ({selectedIds.size})
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          background: 'var(--color-panel)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-panel)',
          border: '1px solid var(--color-border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--color-text-small)" />
          <input
            type="text"
            placeholder="Search indicator value, CIDR, hash, or threat ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        {/* Type pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          {['all', 'ip', 'domain', 'hash', 'cve'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                background: typeFilter === t ? 'var(--color-raised)' : 'transparent',
                color: typeFilter === t ? 'var(--accent-cyan)' : 'var(--color-text-small)',
                border: '1px solid',
                borderColor: typeFilter === t ? 'var(--accent-cyan)' : 'var(--color-border)',
                borderRadius: 'var(--radius-chip)',
                padding: '2px 8px',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* IOC Table Container */}
      <Panel title={`Threat Indicators (${filteredIocs.length} records)`}>
        <div className="ui-table-container">
          <table className="ui-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <button
                    onClick={toggleSelectAll}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-small)', cursor: 'pointer' }}
                    aria-label="Select all IOCs"
                  >
                    {selectedIds.size === filteredIocs.length && filteredIocs.length > 0 ? (
                      <CheckSquare size={16} color="var(--accent-cyan)" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th>Indicator Value</th>
                <th>Type</th>
                <th>Threat Reference</th>
                <th>Reputation</th>
                <th>First Seen</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIocs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-small)' }}>
                    No indicators match active search criteria.
                  </td>
                </tr>
              ) : (
                filteredIocs.slice(0, 50).map(ioc => {
                  const isChecked = selectedIds.has(ioc.id);
                  const displayValue = isRevealed ? ioc.value : ioc.defangedValue;

                  return (
                    <tr key={ioc.id}>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => toggleSelect(ioc.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-small)', cursor: 'pointer' }}
                          aria-label={`Select indicator ${ioc.id}`}
                        >
                          {isChecked ? <CheckSquare size={16} color="var(--accent-cyan)" /> : <Square size={16} />}
                        </button>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: isRevealed ? 'var(--severity-critical)' : 'var(--color-text)',
                            fontWeight: 500
                          }}
                        >
                          {displayValue}
                        </span>
                      </td>
                      <td>
                        <Badge variant={ioc.type === 'ip' ? 'high' : ioc.type === 'domain' ? 'medium' : 'default'}>
                          {ioc.type.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <a
                          href={`/dashboard/threats/${ioc.threatId}`}
                          style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', textDecoration: 'none' }}
                        >
                          {ioc.threatId}
                        </a>
                      </td>
                      <td>
                        <Badge variant={ioc.reputation === 'Malicious' ? 'critical' : 'high'}>
                          {ioc.reputation}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(ioc.firstSeen).toLocaleDateString()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          onClick={() => handleCopy(displayValue, ioc.id)}
                          style={{ minHeight: '26px', padding: '2px 8px', fontSize: 'var(--text-xs)' }}
                          icon={copiedId === ioc.id ? <Check size={12} /> : <Copy size={12} />}
                        >
                          {copiedId === ioc.id ? 'Copied' : 'Copy'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};
