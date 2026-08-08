import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useApostilaProgressMap } from '@/hooks/useApostilaProgressMap';

interface CategorySelectProps {
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
}

export function CategorySelect({ value, onValueChange, placeholder }: CategorySelectProps) {
  const { dbCategories } = useApostilaProgressMap();
  
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder || "Selecione a categoria"} />
      </SelectTrigger>
      <SelectContent>
        {dbCategories.map((cat) => (
          <SelectItem key={cat.id} value={cat.name}>
            {cat.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
