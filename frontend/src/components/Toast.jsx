import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
  success: <CheckCircle size={18} color="#10b981" />,
  error: <AlertCircle size={18} color="#ef4444" />,
  info: <Info size={18} color="#3b82f6" />,
};

const styles = {
  success: { border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.15)' },
  error: { border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.15)' },
  info: { border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.15)' },
};

const textStyles = {
  success: { color: '#10b981' },
  error: { color: '#ef4444' },
  info: { color: '#3b82f6' },
};

export default function Toast({ toast, onDismiss }) {
  const { id, message, type } = toast;

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1.2rem',
        borderRadius: '10px',
        minWidth: '280px',
        maxWidth: '380px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
        ...styles[type] || styles.info,
        pointerEvents: 'all',
        cursor: 'pointer',
      }}
      onClick={() => onDismiss(id)}
    >
      {icons[type] || icons.info}
      <span style={{ fontSize: '0.9rem', fontWeight: '500', flex: 1, ...(textStyles[type] || textStyles.info) }}>
        {message}
      </span>
      <X size={16} color="var(--text-muted)" />
    </div>
  );
}
