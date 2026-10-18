<!-- I'm building a task management application where people create projects and tasks, and label
tasks with tags. There's no login screen yet; that comes later. I have some resources I'd
like you to look at and supervise: -->

I'm building a netflix clone application where people can browse and watch movies. There's no login screen yet; that comes later. I have some resources I'd
like you to look at and supervise:

Here is my DrawSQL schema diagram (a screenshot): @streetflix_erd.png
Here are my user stories: @user_stories.md
My Supabase project is already connected in this directory through the supabase MCP.

Please:

1. Use the `postgresql-table-design` skill and the Context7 MCP to update your context on the
   documentation for Supabase and PostgreSQL.
2. Write the SQL schema for my diagram into `schema.sql`. Confirm it matches the diagram and the
   user stories, and list anything you'd change (including Row Level Security). Don't change my
   design on your own. Then stop.
3. After I approve, create the tables in my Supabase project ONE AT A TIME.
4. After each table, pause and tell me what you did so I can verify it in the dashboard.

Is there any additional information you may need from me?


---

<!-- Claude adds a temporary rule -->
# terminal: Claude in ~/demos/ticked/supabase (the Supabase MCP lives there)
<!-- My tables have Row Level Security on with no policies, so my publishable key gets [] back
in Postman and can't add rows. We don't have logins yet.

Using the Supabase MCP, add TEMPORARY development policies that let the anon role read and write all five tables (users, projects, tasks, tags, task_tags). Name each one
"dev: open access until auth". Show me the SQL first and wait for my approval. -->

My tables have Row Level Security on with no policies, so my publishable key gets [] back
in Postman and can't add rows. We don't have logins yet.

Using the Supabase MCP, add TEMPORARY development policies that let the anon role read and write all five tables (users, genres, titles, title_genres, watchlist_items). Name each one
"dev: open access until auth". Show me the SQL first and wait for my approval.


<!-- Read the SQL before you approve. Then check: Authentication → Policies. -->