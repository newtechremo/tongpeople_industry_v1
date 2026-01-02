import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number;
  unit?: string;
  icon: LucideIcon;
  subtext?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: {
    icon: 'bg-orange-50 text-orange-500',
    value: 'text-orange-600',
  },
  success: {
    icon: 'bg-green-50 text-green-500',
    value: 'text-green-600',
  },
  warning: {
    icon: 'bg-amber-50 text-amber-500',
    value: 'text-amber-600',
  },
  danger: {
    icon: 'bg-red-50 text-red-500',
    value: 'text-red-600',
  },
};

export default function KpiCard({
  title,
  value,
  unit = '',
  icon: Icon,
  subtext,
  variant = 'default',
}: KpiCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="p-8 rounded-2xl border border-gray-200 bg-white shadow-sm
                    transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold text-slate-500 mb-2">{title}</p>
          <h4 className={`text-5xl font-black tracking-tighter ${styles.value}`}>
            {value}
            {unit && <span className="text-2xl ml-1">{unit}</span>}
          </h4>
          {subtext && (
            <p className="text-sm text-slate-400 mt-2">{subtext}</p>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${styles.icon}`}>
          <Icon size={32} />
        </div>
      </div>
    </div>
  );
}
