import { useState, useEffect } from 'react';

interface KawaiiSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
}

export function KawaiiSlider({ value, onChange, min = 5, max = 100, step = 5, label, unit = '' }: KawaiiSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;

  // Kawaii face based on value range
  const face = pct < 25 ? '😴' : pct < 50 ? '🙂' : pct < 75 ? '😊' : '🔥';

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">{label}</span>
          <span className="text-sm font-bold text-primary">
            {value}{unit}
          </span>
        </div>
      )}
      <div className="relative pt-4 pb-2">
        {/* Face indicator */}
        <div
          className="absolute -top-1 text-xl transition-all duration-200 ease-out select-none pointer-events-none"
          style={{ left: `calc(${pct}% - 14px)` }}
        >
          <span className={`inline-block ${isDragging ? 'scale-125' : 'scale-100'} transition-transform duration-150`}>
            {face}
          </span>
        </div>

        {/* Track */}
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, hsl(var(--primary) / 0.6), hsl(var(--primary)))`,
            }}
          />
        </div>

        {/* Native range input (invisible but functional) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ top: '16px', height: '12px' }}
        />

        {/* Tick marks */}
        <div className="flex justify-between mt-1 px-0.5">
          {[min, Math.round((max - min) / 2 + min), max].map((tick) => (
            <span key={tick} className="text-[9px] text-muted-foreground">{tick}{unit}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
