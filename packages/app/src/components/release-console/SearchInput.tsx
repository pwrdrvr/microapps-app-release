'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <Input
        aria-label="Search apps"
        className="pl-11"
        placeholder="Filter apps"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
