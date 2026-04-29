/**
 * TableGridPicker — seletor visual de tabela estilo Microsoft Word.
 * Mostra uma grade 10×8 onde o hover destaca o tamanho a inserir e o
 * clique confirma. Exibe legenda "N×M Tabela" embaixo.
 */
import { useState } from 'react';

interface Props {
  maxRows?: number;
  maxCols?: number;
  onPick: (rows: number, cols: number) => void;
}

export function TableGridPicker({ maxRows = 8, maxCols = 10, onPick }: Props) {
  const [hover, setHover] = useState<{ r: number; c: number }>({ r: 0, c: 0 });

  return (
    <div
      style={{
        padding: 10,
        background: '#fff',
        border: '1px solid #C8C6C4',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        userSelect: 'none',
        fontFamily: '"Segoe UI", system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: 11, color: '#1F1F1F', marginBottom: 6 }}>Inserir Tabela</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${maxCols}, 18px)`,
          gridAutoRows: '18px',
          gap: 2,
        }}
        onMouseLeave={() => setHover({ r: 0, c: 0 })}
      >
        {Array.from({ length: maxRows * maxCols }).map((_, i) => {
          const r = Math.floor(i / maxCols) + 1;
          const c = (i % maxCols) + 1;
          const active = r <= hover.r && c <= hover.c;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover({ r, c })}
              onClick={() => onPick(hover.r, hover.c)}
              style={{
                width: 18,
                height: 18,
                border: '1px solid ' + (active ? '#2B579A' : '#C8C6C4'),
                background: active ? '#C7E0F4' : '#FFFFFF',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: '#605E5C', marginTop: 6, textAlign: 'center' }}>
        {hover.r > 0 ? `${hover.r} × ${hover.c} Tabela` : 'Passe o mouse para selecionar'}
      </div>
    </div>
  );
}
