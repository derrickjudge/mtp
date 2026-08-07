-- Record how each article's `content` was authored so it can be rendered
-- correctly. Previously every article was injected as raw HTML, so plain-text
-- articles lost their paragraph breaks entirely.
--
-- "TEXT" = blank-line separated plain text (escaped, then paragraphed on read)
-- "HTML" = hand-written markup (sanitized against an allowlist on read)

-- The backfill is bound to the column's creation so a re-run cannot overwrite a
-- format an editor has since changed by hand.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_name = 'Article' and column_name = 'contentFormat'
  ) then
    alter table "Article"
      add column "contentFormat" text not null default 'TEXT';

    -- Classify existing rows by inspecting their content rather than assuming.
    -- Note \y, not \b: in POSIX regex \b matches a backspace character, so \b
    -- would silently match nothing and leave every row as TEXT.
    update "Article"
    set "contentFormat" = 'HTML'
    where content ~* '<(p|h[1-6]|ul|ol|li|div|br|blockquote|figure|table|strong|b|em|i|a|img|code|pre)\y';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'Article_contentFormat_check'
  ) then
    alter table "Article"
      add constraint "Article_contentFormat_check"
      check ("contentFormat" in ('TEXT', 'HTML'));
  end if;
end $$;
