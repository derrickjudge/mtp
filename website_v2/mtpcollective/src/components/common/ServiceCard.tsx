import { cn } from '@/utils/cn';
import { ReactNode } from 'react';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  className?: string;
}

export function ServiceCard({
  title,
  description,
  icon,
  className,
}: ServiceCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-gray-800 p-6 transition-transform duration-300 hover:scale-105',
        className
      )}
    >
      <div className="mb-4 text-indigo-400">{icon}</div>
      <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
} 