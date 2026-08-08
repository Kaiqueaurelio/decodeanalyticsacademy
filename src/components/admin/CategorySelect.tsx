import React, { useMemo } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface CategorySelectProps {
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  categories: Category[];
}

const SEMESTER_MAP: Record<number, string> = {
  1: '1º Semestre', 2: '2º Semestre', 3: '3º Semestre',
  4: '4º Semestre', 5: '5º Semestre', 6: '6º Semestre',
  7: '7º Semestre', 8: '8º Semestre', 9: '9º Semestre', 10: '10º Semestre'
};

export function CategorySelect({ value, onValueChange, placeholder, categories }: CategorySelectProps) {
  const grouped = useMemo(() => {
    const map: Record<number, string[]> = {};
    categories.forEach(c => {
      const sem = Math.floor(c.sort_order / 100);
      if (!map[sem]) map[sem] = [];
      map[sem].push(c.name);
    });
    return map;
  }, [categories]);
  
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder || "Selecione a categoria"} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {Object.entries(grouped).sort(([a], [b]) => +a - +b).map(([sem, names]) => (
          <div key={sem}>
            <div className="px-2 py-1.5 text-xs font-semibold text-primary sticky top-0 bg-popover">
              {SEMESTER_MAP[+sem] || `Semestre ${sem}`}
            </div>
            {names.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}

