import React from 'react';

export function AdsChatBuilder() {
  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
      <h1>Teste de Diagnóstico - Chat de Anúncios</h1>
      <p>Se você está vendo esta mensagem, o sistema de abas está funcionando corretamente.</p>
      <p>O erro anterior provavelmente era causado por uma incompatibilidade de componentes UI ou ícones.</p>
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => alert('Funcionando!')}
          style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Clique aqui para testar
        </button>
      </div>
    </div>
  );
}
