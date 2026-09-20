begin;
alter table public.electroshop_categories add column if not exists banner_path text not null default '';
update public.electroshop_categories c set banner_path=v.path from (values
 ('speakers','images/speakers-banner.png'),('guitars','images/guitars-heading.png'),
 ('mobile','images/mobile-accessories-banner.png'),('earphones','images/earphones-banner.png'),
 ('chargers-cables','images/chargers-cables-banner.png'),('smartphones','images/pelephone-city-banner.png')
) v(slug,path) where (c.slug=v.slug or v.slug=any(c.aliases)) and c.banner_path='';
notify pgrst,'reload schema';
commit;
