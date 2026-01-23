alter table buildhub.materiais_sobra
  add column if not exists material_id uuid references buildhub.materiais(id) on delete set null,
  add column if not exists movimento_estoque_id uuid references buildhub.materiais_movimentos(id) on delete set null;

create index if not exists idx_buildhub_materiais_sobra_material_id on buildhub.materiais_sobra(material_id);
create index if not exists idx_buildhub_materiais_sobra_movimento_id on buildhub.materiais_sobra(movimento_estoque_id);
