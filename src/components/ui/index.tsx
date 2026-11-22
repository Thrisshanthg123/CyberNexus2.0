import React, { useState, useEffect, ReactNode, useRef, useId } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  RefreshCw,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';
import { Severity } from '../../types';
import './primitives.css';

// ============================================================================
// 1. Panel & PanelHeader
// ============================================================================
export interface PanelHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  description,
  action,
  className = ''
}) => (
  <header className={`ui-panel-header ${className}`}>
    <div className="ui-panel-title-group">
      <h3 className="ui-panel-title">{title}</h3>
      {description && <p className="ui-panel-description">{description}</p>}
    </div>
    {action && <div className="ui-panel-action">{action}</div>}
  </header>
);

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  raised?: boolean;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  description,
  action,
  children,
  raised = false,
  className = '',
  ...props
}) => {
  return (
    <section className={`ui-panel ${raised ? 'ui-panel-raised' : ''} ${className}`} {...props}>
      {(title || action || description) && (
        <PanelHeader title={title} description={description} action={action} />
      )}
      {children}
    </section>
  );
};

// ============================================================================
// 2. KpiCard (value, delta, sparkline)
// ============================================================================
export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'critical' | 'good' | 'neutral';
  subtext?: ReactNode;
  icon?: ReactNode;
  iconVariant?: 'blue' | 'emerald' | 'amber' | 'purple' | 'red';
  sparklineData?: number[];
  badge?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  delta,
  deltaType = 'neutral',
  subtext,
  icon,
  iconVariant = 'blue',
  sparklineData,
  badge,
  className = '',
  onClick
}) => {
  return (
    <div
      className={`ui-kpi-card ui-kpi-card-${iconVariant} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="ui-kpi-header">
        <span className="ui-kpi-label">{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {badge}
          {icon && (
            <div className={`ui-kpi-icon-chip ui-kpi-icon-${iconVariant}`} aria-hidden="true">
              {icon}
            </div>
          )}
        </div>
      </div>
      <div className="ui-kpi-value-row">
        <span
          className="ui-kpi-value tabular-nums"
          style={
            typeof value === 'string' && isNaN(Number(value))
              ? { fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.35 }
              : undefined
          }
        >
          {value}
        </span>
        {delta && (
          <span className={`ui-kpi-delta ui-kpi-delta-${deltaType}`}>
            {delta}
          </span>
        )}
      </div>
      {subtext && <div className="ui-kpi-subtext">{subtext}</div>}
      {sparklineData && sparklineData.length > 1 && (
        <svg className="ui-kpi-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
          {(() => {
            const min = Math.min(...sparklineData);
            const max = Math.max(...sparklineData) || 1;
            const points = sparklineData.map((d, i) => {
              const x = (i / (sparklineData.length - 1)) * 100;
              const y = 22 - ((d - min) / (max - min || 1)) * 18;
              return `${x},${y}`;
            }).join(' ');
            return (
              <polyline
                className="ui-kpi-sparkline-line"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            );
          })()}
        </svg>
      )}
    </div>
  );
};

// ============================================================================
// 3. SeverityBadge (strictly paired with indicator dot & label)
// ============================================================================
export interface SeverityBadgeProps {
  severity: Severity | string;
  className?: string;
  showDot?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  className = '',
  showDot = true
}) => {
  const normalized = (severity || 'low').toLowerCase() as Severity;
  const validSeverity = ['critical', 'high', 'medium', 'low'].includes(normalized)
    ? normalized
    : 'low';

  return (
    <span className={`ui-severity-badge ui-severity-badge-${validSeverity} ${className}`}>
      {showDot && <span className="ui-severity-dot" aria-hidden="true" />}
      <span>{severity}</span>
    </span>
  );
};

// Generic Badge
export interface BadgeProps {
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'simulated' | 'planned' | 'active' | 'default';
  children: ReactNode;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  title,
  style
}) => {
  if (variant === 'simulated') {
    return <MockDataBadge title={title} className={className} style={style}>{children}</MockDataBadge>;
  }

  return (
    <span className={`ui-badge ui-badge-${variant} ${className}`} title={title} style={style}>
      {children}
    </span>
  );
};

// ============================================================================
// MockDataBadge (Condition 2: Never present mock metrics as real)
// ============================================================================
export interface MockDataBadgeProps {
  children?: ReactNode;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const MockDataBadge: React.FC<MockDataBadgeProps> = ({
  children = 'Simulated data',
  title = 'Simulated data generated client-side; not real backend telemetry',
  className = '',
  style
}) => {
  return (
    <span
      className={`ui-mock-badge ${className}`}
      title={title}
      style={style}
      aria-label="Simulated data indicator"
    >
      <span aria-hidden="true" style={{ fontSize: '9px' }}>⚡</span>
      {children}
    </span>
  );
};

// ============================================================================
// 4. StatusDot
// ============================================================================
export interface StatusDotProps {
  status: 'online' | 'offline' | 'warning' | 'planned';
  title?: string;
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, title, className = '' }) => (
  <span
    className={`ui-status-dot ui-status-dot-${status} ${className}`}
    title={title || `Status: ${status}`}
    aria-label={`Status: ${status}`}
  />
);

// ============================================================================
// 5. Buttons & IconButtons
// ============================================================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const resolvedVariant = variant === 'outline' ? 'secondary' : variant;
  return (
    <button
      className={`ui-btn ui-btn-${resolvedVariant} ${size === 'sm' ? 'ui-btn-sm' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <RefreshCw size={14} className="spin" aria-hidden="true" />
      ) : (
        icon && <span aria-hidden="true">{icon}</span>
      )}
      {children}
    </button>
  );
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  ariaLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  ariaLabel,
  className = '',
  ...props
}) => (
  <button
    type="button"
    className={`ui-btn ui-btn-ghost ui-btn-icon ${className}`}
    aria-label={ariaLabel}
    title={ariaLabel}
    {...props}
  >
    {icon}
  </button>
);

// ============================================================================
// 6. DataTable (sticky header, sortable, selectable rows, pagination)
// ============================================================================
export interface Column<T> {
  header: string;
  key: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectKey?: (key: string) => void;
  onSelectAll?: () => void;
  pageSize?: number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  sortKey,
  sortOrder = 'asc',
  onSort,
  selectable,
  selectedKeys,
  onSelectKey,
  onSelectAll,
  pageSize = 10,
  loading,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters or search terms.',
  className = ''
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / pageSize) || 1;

  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, pageSize]);

  if (loading) {
    return (
      <div className="ui-table-container">
        <Skeleton height={240} width="100%" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="ui-table-container">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={`ui-table-container ${className}`}>
      <table className="ui-table">
        <thead>
          <tr>
            {selectable && (
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={data.length > 0 && selectedKeys?.size === data.length}
                  onChange={onSelectAll}
                />
              </th>
            )}
            {columns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width, textAlign: col.align || 'left' }}
                className={col.sortable ? 'sortable' : ''}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>{col.header}</span>
                  {col.sortable && sortKey === col.key && (
                    sortOrder === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map(item => {
            const key = keyExtractor(item);
            const isSelected = selectedKeys?.has(key);
            return (
              <tr key={key} className={isSelected ? 'selected' : ''}>
                {selectable && (
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      aria-label={`Select row ${key}`}
                      checked={isSelected || false}
                      onChange={() => onSelectKey?.(key)}
                    />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                    {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as ReactNode}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="ui-table-pagination">
          <span>
            Page {currentPage} of {totalPages} ({data.length} total)
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Tooltip content={currentPage <= 1 ? 'Already on first page' : 'Previous page'}>
              <div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={currentPage <= 1}
                  aria-disabled={currentPage <= 1 ? 'true' : undefined}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </Button>
              </div>
            </Tooltip>
            <Tooltip content={currentPage >= totalPages ? 'Already on last page' : 'Next page'}>
              <div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={currentPage >= totalPages}
                  aria-disabled={currentPage >= totalPages ? 'true' : undefined}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 7. FilterChips
// ============================================================================
export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterChipsProps {
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  options,
  selectedValue,
  onChange,
  className = ''
}) => (
  <div className={`ui-filter-chips ${className}`} role="tablist">
    {options.map(opt => (
      <button
        key={opt.value}
        type="button"
        role="tab"
        aria-selected={selectedValue === opt.value}
        className={`ui-filter-chip ${selectedValue === opt.value ? 'active' : ''}`}
        onClick={() => onChange(opt.value)}
      >
        <span>{opt.label}</span>
        {opt.count !== undefined && (
          <span style={{ opacity: 0.7, marginLeft: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            ({opt.count})
          </span>
        )}
      </button>
    ))}
  </div>
);

// ============================================================================
// 8. SearchInput
// ============================================================================
export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChangeValue: (value: string) => void;
  onClear?: () => void;
  width?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeValue,
  onClear,
  width = '240px',
  placeholder = 'Search...',
  className = '',
  ...props
}) => (
  <div className={`ui-search-box ${className}`} style={{ width }}>
    <Search size={14} className="ui-search-icon" aria-hidden="true" />
    <input
      type="text"
      className="ui-search-input"
      value={value}
      onChange={e => onChangeValue(e.target.value)}
      placeholder={placeholder}
      {...props}
    />
    {value && (
      <button
        type="button"
        className="ui-search-clear"
        onClick={() => {
          onChangeValue('');
          onClear?.();
        }}
        aria-label="Clear search"
      >
        <X size={13} />
      </button>
    )}
  </div>
);

// ============================================================================
// 9. Drawer (slide-over panel)
// ============================================================================
export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, subtitle, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ui-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ui-drawer-content" onClick={e => e.stopPropagation()}>
        <header className="ui-drawer-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-16)', color: 'var(--text-primary)', fontWeight: 600 }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ margin: 0, fontSize: 'var(--text-12)', color: 'var(--text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <IconButton icon={<X size={16} />} ariaLabel="Close drawer" onClick={onClose} />
        </header>
        <div className="ui-drawer-body">{children}</div>
      </div>
    </div>
  );
};

// ============================================================================
// 10. Modal
// ============================================================================
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ui-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ui-modal-content" onClick={e => e.stopPropagation()}>
        <header className="ui-modal-header">
          <h3 style={{ margin: 0, fontSize: 'var(--text-16)', color: 'var(--text-primary)' }}>{title}</h3>
          <IconButton icon={<X size={16} />} ariaLabel="Close dialog" onClick={onClose} />
        </header>
        <div className="ui-modal-body">{children}</div>
        {footer && <footer className="ui-modal-footer">{footer}</footer>}
      </div>
    </div>
  );
};

// ============================================================================
// 11. Tabs
// ============================================================================
export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeId, onChange, className = '' }) => (
  <nav className={`ui-tabs ${className}`} role="tablist">
    {tabs.map(tab => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={activeId === tab.id}
        className={`ui-tab-btn ${activeId === tab.id ? 'active' : ''}`}
        onClick={() => onChange(tab.id)}
      >
        <span>{tab.label}</span>
        {tab.count !== undefined && (
          <span style={{ marginLeft: '4px', fontSize: '11px', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
            ({tab.count})
          </span>
        )}
      </button>
    ))}
  </nav>
);

// ============================================================================
// 12. Tooltip
// ============================================================================
export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
}

function isElementDisabled(el: ReactNode): boolean {
  if (!React.isValidElement(el)) return false;
  const props = el.props as any;
  if (Boolean(props.disabled) || props['aria-disabled'] === true || props['aria-disabled'] === 'true') {
    return true;
  }
  if (React.isValidElement(props.children)) {
    return isElementDisabled(props.children);
  }
  return false;
}

function attachAriaDescribedBy(el: ReactNode, id: string): ReactNode {
  if (!React.isValidElement(el)) return el;
  const props = el.props as any;

  if (React.isValidElement(props.children)) {
    return React.cloneElement(el as React.ReactElement<any>, {
      children: attachAriaDescribedBy(props.children, id)
    });
  }

  const existing = props['aria-describedby'];
  const merged = existing ? `${existing} ${id}` : id;
  return React.cloneElement(el as React.ReactElement<any>, {
    'aria-describedby': merged
  });
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, ariaLabel }) => {
  const [visible, setVisible] = useState(false);
  const reactId = useId();
  const tooltipId = `ui-tip-${reactId.replace(/:/g, '')}`;

  const isDisabled = isElementDisabled(children);
  const enhancedChildren = attachAriaDescribedBy(children, tooltipId);

  return (
    <div
      className="ui-tooltip-wrapper"
      tabIndex={isDisabled ? 0 : undefined}
      role={isDisabled ? 'group' : undefined}
      aria-describedby={isDisabled ? tooltipId : undefined}
      aria-label={isDisabled ? (typeof content === 'string' ? content : ariaLabel) : undefined}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      onKeyDown={e => {
        if (e.key === 'Escape') setVisible(false);
      }}
    >
      {enhancedChildren}
      {visible && content && (
        <div id={tooltipId} className="ui-tooltip" role="tooltip">
          {content}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 13. Skeleton
// ============================================================================
export interface SkeletonProps {
  height?: number | string;
  width?: number | string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  height = '16px',
  width = '100%',
  borderRadius,
  className = '',
  style
}) => (
  <div
    className={`ui-skeleton ${className}`}
    style={{
      height,
      width,
      borderRadius: borderRadius || 'var(--radius-sm)',
      ...style
    }}
    aria-hidden="true"
  />
);

// ============================================================================
// 14. EmptyState
// ============================================================================
export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data available',
  description = 'No records match the selected filter criteria.',
  icon,
  action
}) => (
  <div className="ui-empty-state">
    <div className="ui-empty-icon">{icon || <AlertCircle size={32} />}</div>
    <h4 className="ui-empty-title">{title}</h4>
    <p className="ui-empty-desc">{description}</p>
    {action && <div style={{ marginTop: 'var(--space-2)' }}>{action}</div>}
  </div>
);

// ============================================================================
// 15. ErrorState (with retry)
// ============================================================================
export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Telemetry Ingestion Error',
  message = 'Failed to load telemetry data from endpoint.',
  onRetry
}) => (
  <div className="ui-error-state" role="alert">
    <div className="ui-error-icon"><AlertTriangle size={24} /></div>
    <h4 className="ui-error-title">{title}</h4>
    <p className="ui-error-desc">{message}</p>
    {onRetry && (
      <Button
        size="sm"
        variant="secondary"
        icon={<RefreshCw size={13} />}
        onClick={onRetry}
        style={{ marginTop: 'var(--space-2)' }}
      >
        Retry Operation
      </Button>
    )}
  </div>
);

// ============================================================================
// 16. CodeText (mono for CVE IDs, IPs, hashes, timestamps)
// ============================================================================
export interface CodeTextProps {
  text: string;
  allowCopy?: boolean;
  className?: string;
}

export const CodeText: React.FC<CodeTextProps> = ({ text, allowCopy = true, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className={`ui-code-text ${className}`}>
      <span>{text}</span>
      {allowCopy && (
        <button
          type="button"
          className="ui-code-copy-btn"
          onClick={handleCopy}
          title={copied ? 'Copied' : `Copy ${text}`}
          aria-label={copied ? 'Copied' : `Copy ${text}`}
        >
          {copied ? <Check size={11} color="var(--status-success)" /> : <Copy size={11} />}
        </button>
      )}
    </span>
  );
};

// ============================================================================
// 17. Toast
// ============================================================================
export interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="ui-toast" role="status">
      {type === 'success' && <CheckCircle2 size={16} color="var(--status-success)" />}
      {type === 'error' && <AlertCircle size={16} color="var(--severity-critical)" />}
      {type === 'warning' && <AlertTriangle size={16} color="var(--status-warning)" />}
      {type === 'info' && <Info size={16} color="var(--accent-cyan)" />}
      <span>{message}</span>
      <IconButton icon={<X size={14} />} ariaLabel="Close notification" onClick={onClose} />
    </div>
  );
};

// ============================================================================
// 18. CommandPalette (Ctrl+K)
// ============================================================================
export interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Threat' | 'Action';
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="ui-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="ui-modal-content"
        style={{ maxWidth: '580px', marginTop: '-10vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: 'var(--border-subtle)', gap: '10px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, CVE, IOC hash, or module..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-14)',
              fontFamily: 'var(--font-ui)'
            }}
          />
          <kbd style={{ fontSize: '11px', background: 'var(--bg-raised)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle-color)', color: 'var(--text-muted)' }}>
            ESC
          </kbd>
        </div>

        <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-13)' }}>
              No commands or entities match &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map(cmd => (
              <div
                key={cmd.id}
                onClick={() => {
                  cmd.onSelect();
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-13)',
                  color: 'var(--text-primary)',
                  transition: 'background var(--motion-fast)'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-raised)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    {cmd.category}
                  </span>
                  <span>{cmd.title}</span>
                </div>
                {cmd.shortcut && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {cmd.shortcut}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
