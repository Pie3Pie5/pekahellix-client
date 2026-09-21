-- PEKAHELLIX CLIENT V0.1 — à exécuter APRES le schéma Pekahellix OS H.2.x
create extension if not exists pgcrypto;

create table if not exists public.communication_customer_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  public_code text not null unique default encode(gen_random_bytes(9),'hex'),
  label text not null default 'T0',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists communication_customer_campaigns_org_idx on public.communication_customer_campaigns(organization_id,created_at desc);

create table if not exists public.communication_customer_responses (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.communication_customer_campaigns(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  responses jsonb not null,
  nps smallint check (nps between 0 and 10),
  scoring_version text not null default '360-v1',
  created_at timestamptz not null default now()
);
create index if not exists communication_customer_responses_campaign_idx on public.communication_customer_responses(campaign_id,created_at desc);
create index if not exists communication_customer_responses_org_idx on public.communication_customer_responses(organization_id,created_at desc);

alter table public.communication_customer_campaigns enable row level security;
alter table public.communication_customer_responses enable row level security;
revoke all on public.communication_customer_campaigns from anon,authenticated;
revoke all on public.communication_customer_responses from anon,authenticated;

-- Le public ne reçoit que le nom du commerce et le libellé de la campagne.
create or replace function public.get_communication_customer_campaign(p_public_code text)
returns table(organization_name text,campaign_label text)
language sql security definer set search_path=public
as $$
  select o.name,c.label
  from public.communication_customer_campaigns c
  join public.organizations o on o.id=c.organization_id
  where c.public_code=p_public_code
    and c.is_active=true
    and c.starts_at<=now()
    and (c.ends_at is null or c.ends_at>=now())
  limit 1;
$$;
revoke all on function public.get_communication_customer_campaign(text) from public;
grant execute on function public.get_communication_customer_campaign(text) to anon,authenticated;

-- Envoi anonyme : aucun user_id, nom, email ou téléphone n'est stocké par cette fonction.
create or replace function public.submit_communication_customer_response(p_public_code text,p_responses jsonb,p_nps smallint)
returns void
language plpgsql security definer set search_path=public
as $$
declare v_campaign uuid; v_org uuid;
begin
  if p_nps is null or p_nps<0 or p_nps>10 then raise exception 'NPS invalide'; end if;
  if p_responses is null or jsonb_typeof(p_responses)<>'object' then raise exception 'Réponses invalides'; end if;
  select c.id,c.organization_id into v_campaign,v_org
  from public.communication_customer_campaigns c
  where c.public_code=p_public_code and c.is_active=true and c.starts_at<=now() and (c.ends_at is null or c.ends_at>=now())
  limit 1;
  if v_campaign is null then raise exception 'Campagne indisponible'; end if;
  insert into public.communication_customer_responses(campaign_id,organization_id,responses,nps)
  values(v_campaign,v_org,p_responses,p_nps);
end;
$$;
revoke all on function public.submit_communication_customer_response(text,jsonb,smallint) from public;
grant execute on function public.submit_communication_customer_response(text,jsonb,smallint) to anon,authenticated;

-- Lecture réservée aux administrateurs Pekahellix authentifiés.
create or replace function public.admin_communication_customer_report(p_campaign_id uuid)
returns table(response_count bigint,nps numeric,responses jsonb)
language plpgsql security definer set search_path=public
as $$
begin
  if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin' and p.is_active=true) then raise exception 'Accès refusé'; end if;
  return query
  select count(*)::bigint,
    case when count(*)=0 then null else
      round(100.0*count(*) filter(where r.nps>=9)/count(*) - 100.0*count(*) filter(where r.nps<=6)/count(*),1)
    end,
    coalesce(jsonb_agg(jsonb_build_object('responses',r.responses,'nps',r.nps,'created_at',r.created_at) order by r.created_at desc),'[]'::jsonb)
  from public.communication_customer_responses r where r.campaign_id=p_campaign_id;
end;
$$;
revoke all on function public.admin_communication_customer_report(uuid) from public;
grant execute on function public.admin_communication_customer_report(uuid) to authenticated;

-- Exemple de création de campagne (à adapter après avoir récupéré l'UUID de l'organisation) :
-- insert into public.communication_customer_campaigns(organization_id,label) values ('UUID_ORGANISATION','T0') returning public_code;
