alter table buildhub.caixa_empresa_movimentos
drop constraint if exists caixa_empresa_movimentos_categoria_check;

alter table buildhub.caixa_empresa_movimentos
add constraint caixa_empresa_movimentos_categoria_check
check (categoria in ('aporte', 'despesa_empresa', 'prolabore', 'retirada_dono', 'outros'));
