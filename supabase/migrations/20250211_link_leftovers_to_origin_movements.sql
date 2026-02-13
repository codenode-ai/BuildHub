alter table buildhub.materiais_sobra
add column if not exists movimento_obra_origem_id uuid
references buildhub.materiais_movimentos(id) on delete set null;

create index if not exists idx_buildhub_materiais_sobra_movimento_obra_origem_id
on buildhub.materiais_sobra(movimento_obra_origem_id);
