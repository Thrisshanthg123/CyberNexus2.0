import React, { useState, useEffect, ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, RefreshCw } from 'lucide-react';
import './primitives.css';

// 1. Panel
export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({ title, action, children, className = '', ...props }) => {
  return (
    <section className={`ui-panel ${className}`} {...props}>
      {(title || action) && (
        <header className="ui-panel-header">
          {title && <h3 className="ui-panel-title">{title}</h3>}
          {action && <div className="ui-panel-action">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
};

// 2. Badge
export interface BadgeProps {
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'simulated' | 'planned' | 'active' | 'default';
  children: ReactNode;
  className?: string;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '', title }) => {
  return (
    <span className={`ui-badge ui-badge-${variant} ${className}`} title={title}>
      {variant === 'simulated' && <span aria-hidden="true" style={{ fontSize: '10px' }}>⚡</span>}
      {children}
    </span>
  );
};

// 3. Button & IconButton
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: ReactNode;
  children?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`ui-btn ui-btn-${variant} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  'aria-label': string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'secondary',
  className = '',
  ...props
}) => {
  return (
    <button
      className={`ui-btn ui-btn-icon ui-btn-${variant} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};

// 4. Tabs
export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeId, onChange, className = '' }) => {
  return (
    <div className={`ui-tabs-container ${className}`} role="tablist">
      {tabs.map(tab => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            style={{
              background: isActive ? 'var(--color-raised)' : 'transparent',
              color: isActive ? 'var(--color-text)' : 'var(--color-text-small)',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              padding: 'var(--space-2) var(--space-4)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              fontWeight: isActive ? 600 : 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              transition: 'all var(--transition-fast)'
            }}
          >
            {tab.icon}
            {tab.label}
            {typeof tab.count === 'number' && (
              <span className="ui-badge ui-badge-default tabular-nums">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// 5. Modal
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ui-overlay-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="ui-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h2 id="modal-title" style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{title}</h2>
          <IconButton icon={<X size={18} />} aria-label="Close modal" variant="outline" onClick={onClose} />
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

// 6. Drawer
export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ui-overlay-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <aside className="ui-drawer" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{title}</div>
          <IconButton icon={<X size={18} />} aria-label="Close drawer" variant="outline" onClick={onClose} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      </aside>
    </div>
  );
};

// 7. Tooltip
export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="ui-tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && <div className="ui-tooltip-content" role="tooltip">{content}</div>}
    </div>
  );
};

// 8. DataTable
export interface Column<T> {
  header: string;
  key: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  onRowClick,
  className = '',
  emptyMessage = 'No records found'
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const valA = (a as any)[sortKey];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const valB = (b as any)[sortKey];
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortOrder]);

  return (
    <div className={`ui-table-container ${className}`}>
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width, cursor: col.sortable ? 'pointer' : 'default' }}
                onClick={() => handleSort(col.key, col.sortable)}
                role={col.sortable ? 'button' : undefined}
                tabIndex={col.sortable ? 0 : undefined}
                onKeyDown={e => {
                  if (col.sortable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleSort(col.key, true);
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <span>{col.header}</span>
                  {col.sortable && sortKey === col.key && (
                    <span style={{ fontSize: '10px' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-small)' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map(item => (
              <tr
                key={String(item[keyField])}
                onClick={() => onRowClick && onRowClick(item)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={e => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onRowClick(item);
                  }
                }}
              >
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// 9. Skeleton
export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-chip)',
  className = ''
}) => {
  return (
    <div
      className={`ui-skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius
      }}
      aria-hidden="true"
    />
  );
};

// 10. EmptyState
export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  description = 'There are no active records matching this criterion.',
  icon = <Info size={36} color="var(--color-text-muted)" />,
  action
}) => {
  return (
    <div className="ui-empty-state">
      {icon}
      <h4 style={{ fontWeight: 600, color: 'var(--color-text)' }}>{title}</h4>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-small)', maxWidth: '320px' }}>
        {description}
      </p>
      {action && <div style={{ marginTop: 'var(--space-2)' }}>{action}</div>}
    </div>
  );
};

// 11. ErrorState
export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Failed to load threat data.',
  onRetry
}) => {
  return (
    <div className="ui-error-state" role="alert">
      <AlertTriangle size={36} color="var(--severity-critical)" />
      <h4 style={{ fontWeight: 600, color: 'var(--severity-critical)' }}>Data Fetch Error</h4>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-small)', maxWidth: '360px' }}>
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          icon={<RefreshCw size={14} />}
          style={{ borderColor: 'var(--severity-critical)', color: 'var(--severity-critical)' }}
        >
          Retry Connection
        </Button>
      )}
    </div>
  );
};

// 12. Toast
export interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const iconMap = {
    info: <Info size={16} color="var(--accent-cyan)" />,
    success: <CheckCircle2 size={16} color="var(--accent-green)" />,
    warning: <AlertTriangle size={16} color="var(--severity-high)" />,
    error: <AlertCircle size={16} color="var(--severity-critical)" />
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'var(--space-4)',
        right: 'var(--space-4)',
        background: 'var(--color-panel)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-panel)',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        boxShadow: 'var(--shadow-overlay)',
        zIndex: 9999
      }}
      role="status"
    >
      {iconMap[type]}
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{message}</span>
      <IconButton icon={<X size={14} />} aria-label="Close notification" variant="outline" onClick={onClose} />
    </div>
  );
};
