import os
import json
import requests

# Configurações do Supabase via variáveis de ambiente do sandbox
supabase_url = os.environ.get("VITE_SUPABASE_URL")
supabase_key = os.environ.get("VITE_SUPABASE_ANON_KEY")

# ID da apostila alvo
apostila_id = "bb649bd0-724f-4311-bd2c-d5e0d414181d"

# URL do asset criado
asset_url = "/__l5e/assets-v1/ad8e3516-43c9-45e5-858f-3a37dd09a76b/aspects-teoricos-diagram.png"

new_content = """# Aspectos Teóricos da Computação

Este material aborda os fundamentos matemáticos da computação, desde modelos de estados finitos até a complexidade de algoritmos.

---

## 1. Modelos de Computação e Máquinas de Estado

![Diagrama de Estados da Computação](""" + asset_url + """)

A teoria da computação utiliza modelos abstratos para definir o que pode ser computado de forma eficiente.

### 1.1 Máquinas de Moore vs. Máquinas de Mealy
Existem dois tipos principais de transdutores de estados finitos:

> **Dica Acadêmica:** A principal diferença reside em *quando* a saída é gerada.

| Característica | Máquina de Moore | Máquina de Mealy |
| :--- | :--- | :--- |
| **Dependência da Saída** | Depende apenas do **estado atual**. | Depende do **estado atual** e da **entrada**. |
| **Complexidade** | Geralmente possui mais estados para a mesma lógica. | Mais compacta (menos estados). |
| **Tempo de Resposta** | A saída muda sincronizada com a mudança de estado. | A saída pode mudar assim que a entrada muda. |

### 1.2 Máquinas de Turing
A **Máquina de Turing (MT)** é o modelo universal de computação. Ela consiste em:
- Uma **fita infinita** dividida em células.
- Um **cabeçote de leitura/gravação**.
- Um **registro de estado**.

Se um problema pode ser resolvido por um algoritmo, ele pode ser resolvido por uma Máquina de Turing.

---

## 2. Hierarquia de Chomsky
Classifica as gramáticas formais em quatro níveis de complexidade:

1.  **Tipo 3 (Regulares):** Reconhecidas por Autômatos Finitos.
2.  **Tipo 2 (Livres de Contexto):** Reconhecidas por Autômatos de Pilha.
3.  **Tipo 1 (Sensíveis ao Contexto):** Reconhecidas por Autômatos Linearmente Limitados.
4.  **Tipo 0 (Irrestritas):** Reconhecidas por Máquinas de Turing.

---

## 3. Análise de Algoritmos e Complexidade
A eficiência de um algoritmo é medida através da **Notação Big O**.

### 3.1 Classes de Complexidade
- **$O(1)$**: Tempo constante (ex: acessar índice de array).
- **$O(\\log n)$**: Tempo logarítmico (ex: busca binária).
- **$O(n)$**: Tempo linear (ex: busca simples).
- **$O(n^2)$**: Tempo quadrático (ex: Bubble Sort).
- **$O(2^n)$**: Tempo exponencial (ex: problemas NP-completos).

### 3.2 P vs NP
- **P**: Problemas que podem ser **resolvidos** em tempo polinomial.
- **NP**: Problemas cujas soluções podem ser **verificadas** em tempo polinomial.

---

## Exercícios de Fixação

1. **(Questão)** Desenhe o diagrama de estados para um reconhecedor da sequência `101`.
2. **(Questão)** Explique por que a Máquina de Mealy é considerada mais reativa que a de Moore.
3. **(Desafio)** Classifique a complexidade do algoritmo Merge Sort usando a notação Big O."""

# Chamada para atualizar a apostila
update_url = f"{supabase_url}/rest/v1/apostilas?id=eq.{apostila_id}"
headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}
data = {
    "content": new_content
}

response = requests.patch(update_url, headers=headers, json=data)

if response.status_code in [200, 204]:
    print("Sucesso: Apostila atualizada com a imagem.")
else:
    print(f"Erro: {response.status_code} - {response.text}")
