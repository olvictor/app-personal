-- =====================================================================
-- Catálogo inicial de exercícios — correção imediata
--
-- Rode no SQL Editor do Supabase se o seu catálogo apareceu vazio.
-- Insere a lista básica para todo personal que ainda não tem nenhum
-- exercício cadastrado. Pode rodar quantas vezes quiser: não duplica.
-- =====================================================================

insert into public.exercicios (personal_id, nome, grupo, equipamento)
select p.id, x.nome, x.grupo, x.equipamento
from public.personais p
cross join (values
  ('Supino reto com barra','Peito','Barra'),
  ('Supino inclinado com halteres','Peito','Halteres'),
  ('Crucifixo na polia','Peito','Polia'),
  ('Puxada frontal','Costas','Polia'),
  ('Remada curvada','Costas','Barra'),
  ('Remada unilateral','Costas','Halteres'),
  ('Desenvolvimento com halteres','Ombros','Halteres'),
  ('Elevação lateral','Ombros','Halteres'),
  ('Rosca direta','Bíceps','Barra'),
  ('Rosca martelo','Bíceps','Halteres'),
  ('Tríceps testa','Tríceps','Barra W'),
  ('Tríceps corda','Tríceps','Polia'),
  ('Agachamento livre','Pernas','Barra'),
  ('Leg press 45°','Pernas','Máquina'),
  ('Cadeira extensora','Pernas','Máquina'),
  ('Mesa flexora','Pernas','Máquina'),
  ('Elevação pélvica','Glúteos','Barra'),
  ('Panturrilha em pé','Panturrilha','Máquina'),
  ('Prancha abdominal','Core','Peso do corpo'),
  ('Abdominal na polia','Core','Polia')
) as x(nome, grupo, equipamento)
where not exists (
  select 1 from public.exercicios e
  where e.personal_id = p.id and e.nome = x.nome
);

-- Confira quantos ficaram:
select p.nome as personal, count(e.id) as exercicios
from public.personais p
left join public.exercicios e on e.personal_id = p.id
group by p.nome;
