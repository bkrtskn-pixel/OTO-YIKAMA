import { Droplets } from 'lucide-react';
import { cn } from '@/lib/cn';

export function BrandMark({ name, className, inverted = false }: { name: string; className?: string; inverted?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5 font-semibold tracking-tight', className)}>
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-lg',
          inverted ? 'bg-white/10 text-white' : 'bg-brand text-brand-foreground',
        )}
        aria-hidden
      >
        <Droplets className="size-5" />
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}
