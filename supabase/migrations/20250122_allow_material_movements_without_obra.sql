alter table buildhub.materiais_movimentos
  alter column obra_id drop not null;

alter table buildhub.materiais_movimentos
  add constraint materiais_movimentos_uso_requires_obra
  check (tipo <> 'uso' or obra_id is not null);
