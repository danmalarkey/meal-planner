update public.ingredients
set category = 'Beverages', updated_at = now()
where coalesce(nullif(trim(category), ''), 'Other') in ('Other', 'Pantry & Other')
  and (
    name ~* '(^|[[:space:]])(beer|beverage|cider|coffee|coke|cola|drink|juice|kombucha|lemonade|seltzer|tea|wine)([[:space:]]|$)'
    or (
      name ~* '(^|[[:space:]])soda([[:space:]]|$)'
      and name !~* '(^|[[:space:]])(baking|washing)[[:space:]]+soda([[:space:]]|$)'
      and name !~* '(^|[[:space:]])soda[[:space:]]+bread([[:space:]]|$)'
    )
    or lower(trim(name)) ~ '^(cherry |cream |diet |grape |orange |root beer )?pop$'
    or lower(trim(name)) ~ '^(bottled |coconut |flavored |flavoured |mineral |sparkling |tonic )?water$'
  );

update public.grocery_items
set category = 'Beverages', updated_at = now()
where coalesce(nullif(trim(category), ''), 'Other') in ('Other', 'Pantry & Other')
  and (
    name ~* '(^|[[:space:]])(beer|beverage|cider|coffee|coke|cola|drink|juice|kombucha|lemonade|seltzer|tea|wine)([[:space:]]|$)'
    or (
      name ~* '(^|[[:space:]])soda([[:space:]]|$)'
      and name !~* '(^|[[:space:]])(baking|washing)[[:space:]]+soda([[:space:]]|$)'
      and name !~* '(^|[[:space:]])soda[[:space:]]+bread([[:space:]]|$)'
    )
    or lower(trim(name)) ~ '^(cherry |cream |diet |grape |orange |root beer )?pop$'
    or lower(trim(name)) ~ '^(bottled |coconut |flavored |flavoured |mineral |sparkling |tonic )?water$'
  );
