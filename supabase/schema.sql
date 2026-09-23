create extension if not exists "pgcrypto";

create table if not exists public.personais (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  nome        text not null,
  email       text,
  celular     text,
  cref        text,
  local       text,
  criado_em   timestamptz not null default now()
);


create table if not exists public.alunos (
  id              uuid primary key default gen_random_uuid(),
  personal_id     uuid not null references public.personais(id) on delete cascade,
  user_id         uuid unique references auth.users(id) on delete set null,
  nome            text not null,
  celular         text not null,
  celular_login   text not null,
  nascimento      date,
  objetivo        text,
  frequencia      text,
  observacoes     text,
  status          text not null default 'ativo'
                  check (status in ('ativo','pausado','inativo')),
  criado_em       timestamptz not null default now(),
  unique (personal_id, celular_login)
);
create index if not exists alunos_personal_idx on public.alunos(personal_id);

create table if not exists public.acessos (
  id                uuid primary key default gen_random_uuid(),
  aluno_id          uuid not null references public.alunos(id) on delete cascade,
  senha_hash        text not null,
  expira_em         timestamptz not null default (now() + interval '7 days'),
  usado_em          timestamptz,
  criado_em         timestamptz not null default now()
);
create index if not exists acessos_aluno_idx on public.acessos(aluno_id);


create table if not exists public.avaliacoes (
  id            uuid primary key default gen_random_uuid(),
  aluno_id      uuid not null references public.alunos(id) on delete cascade,
  data          date not null default current_date,
  peso          numeric(5,2),
  altura        numeric(3,2),
  gordura       numeric(4,1),
  cintura       numeric(5,1),
  quadril       numeric(5,1),
  braco         numeric(5,1),
  coxa          numeric(5,1),
  observacoes   text,
  registrada_por text not null default 'personal'
                 check (registrada_por in ('personal','aluno')),
  criado_em     timestamptz not null default now()
);
create index if not exists avaliacoes_aluno_idx on public.avaliacoes(aluno_id, data desc);

create table if not exists public.exercicios (
  id            uuid primary key default gen_random_uuid(),
  personal_id   uuid not null references public.personais(id) on delete cascade,
  nome          text not null,
  grupo         text,
  equipamento   text,
  video_url     text,
  criado_em     timestamptz not null default now()
);
create index if not exists exercicios_personal_idx on public.exercicios(personal_id);

create table if not exists public.treinos (
  id            uuid primary key default gen_random_uuid(),
  aluno_id      uuid not null references public.alunos(id) on delete cascade,
  nome          text not null,
  foco          text,
  dias_semana   int[] default '{}',      -- 0=domingo … 6=sábado
  ativo         boolean not null default true,
  recado        text,
  criado_em     timestamptz not null default now()
);
create index if not exists treinos_aluno_idx on public.treinos(aluno_id);

create table if not exists public.treino_exercicios (
  id            uuid primary key default gen_random_uuid(),
  treino_id     uuid not null references public.treinos(id) on delete cascade,
  exercicio_id  uuid references public.exercicios(id) on delete set null,
  nome          text not null,           
  ordem         int not null default 0,
  series        int not null default 3,
  repeticoes    text not null default '10',
  carga         text,
  descanso_seg  int not null default 60,
  rir           text,
  observacao    text
);
create index if not exists treino_ex_idx on public.treino_exercicios(treino_id, ordem);


create table if not exists public.sessoes (
  id            uuid primary key default gen_random_uuid(),
  aluno_id      uuid not null references public.alunos(id) on delete cascade,
  treino_id     uuid references public.treinos(id) on delete set null,
  iniciada_em   timestamptz not null default now(),
  concluida_em  timestamptz,
  percepcao     int check (percepcao between 1 and 10),
  nota          text
);
create index if not exists sessoes_aluno_idx on public.sessoes(aluno_id, iniciada_em desc);


create table if not exists public.sessao_series (
  id                  uuid primary key default gen_random_uuid(),
  sessao_id           uuid not null references public.sessoes(id) on delete cascade,
  treino_exercicio_id uuid references public.treino_exercicios(id) on delete set null,
  numero              int not null,
  reps_feitas         text,
  carga_usada         text,
  concluida_em        timestamptz not null default now(),
  unique (sessao_id, treino_exercicio_id, numero)
);

create table if not exists public.agendamentos (
  id            uuid primary key default gen_random_uuid(),
  personal_id   uuid not null references public.personais(id) on delete cascade,
  aluno_id      uuid not null references public.alunos(id) on delete cascade,
  treino_id     uuid references public.treinos(id) on delete set null,
  dia_semana    int not null check (dia_semana between 0 and 6),
  hora          time not null,
  ativo         boolean not null default true
);
create index if not exists agendamentos_personal_idx on public.agendamentos(personal_id, dia_semana, hora);


create or replace function public.meu_personal_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.personais where user_id = auth.uid()
$$;

create or replace function public.meu_aluno_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.alunos where user_id = auth.uid()
$$;

create or replace function public.aluno_e_meu(p_aluno_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.alunos a
    where a.id = p_aluno_id and a.personal_id = public.meu_personal_id()
  )
$$;

alter table public.personais         enable row level security;
alter table public.alunos            enable row level security;
alter table public.acessos           enable row level security;
alter table public.avaliacoes        enable row level security;
alter table public.exercicios        enable row level security;
alter table public.treinos           enable row level security;
alter table public.treino_exercicios enable row level security;
alter table public.sessoes           enable row level security;
alter table public.sessao_series     enable row level security;
alter table public.agendamentos      enable row level security;

drop policy if exists personais_self on public.personais;
create policy personais_self on public.personais
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists personais_meu_aluno on public.personais;
create policy personais_meu_aluno on public.personais
  for select using (
    exists (select 1 from public.alunos a
            where a.user_id = auth.uid() and a.personal_id = personais.id)
  );

drop policy if exists alunos_do_personal on public.alunos;
create policy alunos_do_personal on public.alunos
  for all using (personal_id = public.meu_personal_id())
  with check (personal_id = public.meu_personal_id());

drop policy if exists alunos_eu_mesmo on public.alunos;
create policy alunos_eu_mesmo on public.alunos
  for select using (user_id = auth.uid());

drop policy if exists acessos_do_personal on public.acessos;
create policy acessos_do_personal on public.acessos
  for all using (public.aluno_e_meu(aluno_id))
  with check (public.aluno_e_meu(aluno_id));

drop policy if exists avaliacoes_do_personal on public.avaliacoes;
create policy avaliacoes_do_personal on public.avaliacoes
  for all using (public.aluno_e_meu(aluno_id))
  with check (public.aluno_e_meu(aluno_id));

drop policy if exists avaliacoes_le_aluno on public.avaliacoes;
create policy avaliacoes_le_aluno on public.avaliacoes
  for select using (aluno_id = public.meu_aluno_id());

drop policy if exists avaliacoes_grava_aluno on public.avaliacoes;
create policy avaliacoes_grava_aluno on public.avaliacoes
  for insert with check (aluno_id = public.meu_aluno_id() and registrada_por = 'aluno');

-- EXERCÍCIOS -----------------------------------------------------------
drop policy if exists exercicios_do_personal on public.exercicios;
create policy exercicios_do_personal on public.exercicios
  for all using (personal_id = public.meu_personal_id())
  with check (personal_id = public.meu_personal_id());

-- TREINOS --------------------------------------------------------------
drop policy if exists treinos_do_personal on public.treinos;
create policy treinos_do_personal on public.treinos
  for all using (public.aluno_e_meu(aluno_id))
  with check (public.aluno_e_meu(aluno_id));

drop policy if exists treinos_le_aluno on public.treinos;
create policy treinos_le_aluno on public.treinos
  for select using (aluno_id = public.meu_aluno_id());

-- TREINO_EXERCICIOS ----------------------------------------------------
drop policy if exists tex_do_personal on public.treino_exercicios;
create policy tex_do_personal on public.treino_exercicios
  for all using (
    exists (select 1 from public.treinos t
            where t.id = treino_id and public.aluno_e_meu(t.aluno_id)))
  with check (
    exists (select 1 from public.treinos t
            where t.id = treino_id and public.aluno_e_meu(t.aluno_id)));

drop policy if exists tex_le_aluno on public.treino_exercicios;
create policy tex_le_aluno on public.treino_exercicios
  for select using (
    exists (select 1 from public.treinos t
            where t.id = treino_id and t.aluno_id = public.meu_aluno_id()));

-- SESSOES --------------------------------------------------------------
drop policy if exists sessoes_do_aluno on public.sessoes;
create policy sessoes_do_aluno on public.sessoes
  for all using (aluno_id = public.meu_aluno_id())
  with check (aluno_id = public.meu_aluno_id());

drop policy if exists sessoes_le_personal on public.sessoes;
create policy sessoes_le_personal on public.sessoes
  for select using (public.aluno_e_meu(aluno_id));

-- SESSAO_SERIES --------------------------------------------------------
drop policy if exists series_do_aluno on public.sessao_series;
create policy series_do_aluno on public.sessao_series
  for all using (
    exists (select 1 from public.sessoes s
            where s.id = sessao_id and s.aluno_id = public.meu_aluno_id()))
  with check (
    exists (select 1 from public.sessoes s
            where s.id = sessao_id and s.aluno_id = public.meu_aluno_id()));

drop policy if exists series_le_personal on public.sessao_series;
create policy series_le_personal on public.sessao_series
  for select using (
    exists (select 1 from public.sessoes s
            where s.id = sessao_id and public.aluno_e_meu(s.aluno_id)));

-- AGENDAMENTOS ---------------------------------------------------------
drop policy if exists agenda_do_personal on public.agendamentos;
create policy agenda_do_personal on public.agendamentos
  for all using (personal_id = public.meu_personal_id())
  with check (personal_id = public.meu_personal_id());

drop policy if exists agenda_le_aluno on public.agendamentos;
create policy agenda_le_aluno on public.agendamentos
  for select using (aluno_id = public.meu_aluno_id());


create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_user_meta_data->>'tipo','') = 'personal' then
    insert into public.personais (user_id, nome, email)
    values (new.id,
            coalesce(new.raw_user_meta_data->>'nome','Personal'),
            new.email)
    on conflict (user_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


create or replace function public.semear_exercicios()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_personal uuid := public.meu_personal_id();
begin
  if v_personal is null then return; end if;
  if exists (select 1 from public.exercicios where personal_id = v_personal) then return; end if;

  insert into public.exercicios (personal_id, nome, grupo, equipamento) values
    (v_personal,'Supino reto com barra','Peito','Barra'),
    (v_personal,'Supino inclinado com halteres','Peito','Halteres'),
    (v_personal,'Crucifixo na polia','Peito','Polia'),
    (v_personal,'Puxada frontal','Costas','Polia'),
    (v_personal,'Remada curvada','Costas','Barra'),
    (v_personal,'Remada unilateral','Costas','Halteres'),
    (v_personal,'Desenvolvimento com halteres','Ombros','Halteres'),
    (v_personal,'Elevação lateral','Ombros','Halteres'),
    (v_personal,'Rosca direta','Bíceps','Barra'),
    (v_personal,'Rosca martelo','Bíceps','Halteres'),
    (v_personal,'Tríceps testa','Tríceps','Barra W'),
    (v_personal,'Tríceps corda','Tríceps','Polia'),
    (v_personal,'Agachamento livre','Pernas','Barra'),
    (v_personal,'Leg press 45°','Pernas','Máquina'),
    (v_personal,'Cadeira extensora','Pernas','Máquina'),
    (v_personal,'Mesa flexora','Pernas','Máquina'),
    (v_personal,'Elevação pélvica','Glúteos','Barra'),
    (v_personal,'Panturrilha em pé','Panturrilha','Máquina'),
    (v_personal,'Prancha abdominal','Core','Peso do corpo'),
    (v_personal,'Abdominal na polia','Core','Polia');
end $$;

alter table public.treino_exercicios
  add column if not exists midia_url text;

update public.treino_exercicios te
set midia_url = e.video_url
from public.exercicios e
where te.exercicio_id = e.id
  and te.midia_url is null
  and e.video_url is not null;