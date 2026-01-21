# Sistema de Gestão de Obras - Documento de Requisitos

## 1. Visão Geral do Produto

### 1.1 Objetivo
Construir um MVP funcional de uma aplicação web para pequenos empreiteiros de construção que atuam nos EUA. A plataforma substitui a organização baseada em pastas e planilhas Excel por um ambiente simples, visual e fácil de navegar, funcionando como um HUB CENTRAL DE OBRAS (PROJETOS).

### 1.2 Público-Alvo
Pequenos empreiteiros de construção nos EUA com pouco ou nenhum conhecimento técnico.

### 1.3 Características Principais
- Sistema bilingue (Português e Inglês) com seletor de idioma no header
- Interface mobile-first, extremamente simples e intuitiva
- Cada obra funciona como centro de custo independente
- Ciclo de vida completo: orçamento → a iniciar → em andamento → (paralisada) → finalizada

## 2. Requisitos Técnicos

### 2.1 Frontend
- Next.js (App Router) com TypeScript
- TailwindCSS para estilização
- Componentes simples e reutilizáveis (shadcn/ui ou equivalente)\n- Navegação clara com botões: Voltar, Editar, Excluir, Salvar

### 2.2 Backend
- Supabase (Auth + Database)
- Schema específico para o ERP no Supabase (schema \"erp\")
- Autenticação com Supabase Auth (email e senha)
- Fluxo de usuário único (sem permissões avançadas)

### 2.3 Deploy
- Vercel

## 3. Regras de Negócio

### 3.1 Relacionamento Cliente-Obra
- Um CLIENTE pode ter VÁRIAS OBRAS (relação 1:N)\n- Exemplo: Reforma de banheiro em 2023 e Ampliação de garagem em 2024 são duas obras diferentes para o mesmo cliente\n- O usuário pode cadastrar um cliente uma vez e criar novas obras para ele ao longo do tempo
- Na tela do cliente, exibir a lista de obras vinculadas e um botão \"Nova Obra\"

### 3.2 Ciclo de Vida da Obra\n- Orçamento\n- A iniciar
- Em andamento
- Paralisada (com motivo opcional)\n- Finalizada
\n## 4. Entidades do Sistema

- Cliente
- Obra
- Orçamento (com itens)
- Receita
- Custo
- Funcionário
- Equipe da Obra
- Lançamentos de mão de obra\n
## 5. Funcionalidades\n
### 5.1 Autenticação
- Tela simples de login (email e senha)
- Fluxo de usuário único

### 5.2 Dashboard de Obras
- Listar todas as obras
- Busca e filtros por status e cliente
- Métricas simples:
  - Quantidade de obras ativas
  - Quantidade de obras finalizadas\n- Ações claras: Nova Obra, Editar, Mudar status, Excluir
\n### 5.3 Clientes
- CRUD completo (criar, editar, excluir)
- Campos mínimos (nome obrigatório)
- Tela do cliente deve mostrar:
  - Dados do cliente
  - Lista de obras associadas
  - Botão \"Nova Obra para este Cliente\"

### 5.4 Obras (Centro do Sistema)
- Criar, editar e excluir obra
- Associar obra a um cliente existente ou criar cliente novo
- Campos simples:\n  - nome/título da obra
  - cliente
  - datas opcionais
- Status da obra: Orçamento, A iniciar, Em andamento, Paralisada (com motivo opcional), Finalizada

#### 5.4.1 Resumo da Obra
Exibir:
- Total orçado
- Total recebido
- Total de custos\n- Total gasto com mão de obra
- Resultado estimado (lucro ou prejuízo)

#### 5.4.2 Navegação Interna da Obra
Seções:
- Resumo\n- Orçamento
- Financeiro
- Equipe / Mão de Obra
- Histórico\n
### 5.5 Orçamento por Obra
- Criar orçamento com itens:\n  - descrição
  - quantidade
  - valor unitário
- Total calculado automaticamente
- Um orçamento por obra no MVP
- Permitir editar itens
- Status simples: Em revisão, Aprovado\n- Não exportar PDF
\n### 5.6 Financeiro por Obra
\n#### 5.6.1 Receitas
- Registrar receitas:
  - valor
  - data
  - forma de pagamento (texto simples)\n\n#### 5.6.2 Custos
- Registrar custos:
  - valor
  - data
  - tipo de custo (somente dois): Mão de obra, Material / Outros
- Tudo sempre vinculado à obra
- Sistema calcula automaticamente:
  - total recebido
  - total de custos
  - resultado da obra
\n### 5.7 Funcionários\n- Cadastro de funcionários com CRUD completo
- Campos:
  - nome (obrigatório)
  - tipo de cobrança (hora ou dia)
  - valor (obrigatório)
- Esses funcionários serão usados nas obras

### 5.8 Equipe da Obra + Mão de Obra
- Dentro da obra, ter uma seção \"Equipe\"
- O usuário seleciona quais funcionários trabalham naquela obra
- A equipe deve ficar sempre visível na obra
\n#### 5.8.1 Lançamento de Mão de Obra
- funcionário
- data
- quantidade (horas ou dias)
- observação opcional
- O sistema calcula automaticamente o custo (quantidade × valor)
\n#### 5.8.2 Resumo de Mão de Obra
Exibir:
- total de horas/dias
- total gasto com mão de obra
\nImportante: Mão de obra é apenas um tipo de custo. Não criar RH, ponto, escala ou controle avançado.

### 5.9 Dashboard Financeiro (Visão Geral)
- Tela separada \"Financeiro\"
- Filtro por período (mês ou intervalo de datas)
- Indicadores:
  - Faturamento no período
  - Total de custos no período
  - Resultado (lucro/prejuízo)
  - Quantidade de obras finalizadas no período
- Permitir filtros por cliente e por obra

## 6. Princípios de UX

- Mobile-first
- Botões grandes
- Formulários curtos
- Botão \"Voltar\" sempre presente\n- CRUD completo em tudo
- Confirmação ao excluir dados
- Mensagens simples de erro e sucesso
- O sistema deve parecer mais simples que Excel

## 7. Restrições e Exclusões

### 7.1 NÃO FAZER
- Upload/download de arquivos, fotos ou anexos
- Integrações externas (Stripe, QuickBooks etc.)
- Sistema de permissões ou papéis
- Relatórios avançados de BI
- Design sofisticado ou visual excessivamente elaborado

## 8. Conceito Central

- Tudo é organizado por OBRA
- O usuário insere e manipula os dados manualmente
- O sistema apenas calcula totais, somatórios e indicadores
- A experiência substitui Excel/pastas por telas navegáveis e CRUD simples
- Criar, editar, excluir e voltar devem ser ações óbvias e intuitivas