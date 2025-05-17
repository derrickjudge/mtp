import { cn } from '@/utils/cn';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function SectionHeader({
  title,
  subtitle,
  className,
  align = 'center',
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-16', alignClasses[align], className)}>
      <h2 className="text-4xl font-bold text-white mb-4">{title}</h2>
      {subtitle && (
        <p className="text-xl text-gray-300 max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
} 