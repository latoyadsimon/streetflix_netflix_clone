10/19/2026

<!-- I backed up all five tables to CSV in supabase/backups/. Using the Supabase MCP, drop every table in the public schema (users, projects, tags, tasks, task_tags) and the create_task_with_tags function, so the project is empty. Show me the SQL first and wait for my approval. -->

I backed up all six tables to CSV in supabase/backups/. Using the Supabase MCP, drop every table in the public schema (users, watchlist_items, title_genres, genres, titles, catalog_titles ) so the project is empty. Show me the SQL first and wait for my approval.

<!-- The Supabase prompt
The curriculum's prompt with our paths, plus our "Also for this project" block. The tables are gone (last slide), so it starts empty. -->

I have confirmed my application works well with this type of database schema and am now ready
to implement authentication methods to my project.

I would like you to take a look at the following resources:

1. User Journey can be found: front-end/app_outline/user_journey.md
2. The current supabase schema is as follows: supabase/schema.sql
3. The current testing data I've populated while ensuring this works is here: supabase/backups/

You should know that I've currently deleted all tables existing in my project and it is now an empty project.

Using these resources as context I would like you to conduct the following:

1. alter the user table function as an authentication table
2. ensure proper RLS policies are set where a user can only view the tasks they own.
3. recreate my database tables on supabase

After conducting each action, pause and ask for confirmation that your actions worked correctly before proceeding to the next step.

<!-- instructor added this part for his own project, editing it for mine -->

Also for this project:

- Do the steps in this order: users, then the tables, then the RLS policies.

<!-- - projects.user_id and tasks.user_id: not null, default auth.uid(), on delete cascade. The app will never send a user id. -->

- Start with empty tables. Don't re-import the backups: their rows belong to a Demo User who has no login.

<!-- - Tags stay shared: any signed-in user can read and add them.
- My front end calls create_task_with_tags. Recreate it after the policies: no p_user_id, security invoker, executable by authenticated only. -->

- Keep rls_auto_enable(). Only touch my app's tables and functions.
- Before applying each step, show me the complete SQL. When you're done, rewrite supabase/schema.sql to match, header comments included.

Do you have any questions before executing this task?

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

<!-- 10/20/26 -->

Utilizing the following resources:

- Supabase db schema: supabase/schema.sql
- user journey: front-end/app_outline/user_journey.md
- Project API url: https://<your-project-id></your>.supabase.co
- Project API Key: sb_publishable_<your key></your>

I would like you to update the functionality for the User Authentication process. Consider the following actions a user can take:

- Register: A brand new user can sign up for our application and interact with our site.
- Log In: A returning user can interact with our site and ONLY their corresponding data
- Log out: A logged in user can end their session and exit our website while removing their credentials from the front-end code.
- User Confirmation: While logged in we need to have a way of confirming who the user is
  - while logged in if the user refreshes the browser, we should be able of leveraging the current credentials to recover the logged in `user` and their corresponding`data`

Each of these actions should be an independent phase. Utilize playwright to ensure completion of each phase prior to moving on to the next one.

Do you have any questions before completing these actions?

<!-- Serverless Functions: Edge functions

Hello World Function -  -->

Create a Supabase Edge Function called `hello-world`.

The function should return a JSON response: { "message": "Hello, World!" }

Include proper CORS headers so the function can be called from a browser.

After creating the function, deploy it using the Supabase CLI and show me the
curl command to test it, using my project's deployed function URL.

<!-- Create a Supabase Edge Function called `add-numbers`. -->

The function should read two query parameters, `a` and `b`, add them together
as numbers, and return a JSON response in the shape: { "result": <sum></sum> }

Requirements:

- Include CORS headers
- Handle the case where `a` or `b` are missing or not valid numbers — return a
  400 status with a JSON error message explaining what went wrong
- Deploy the function when complete and give me curl commands that test both the
  happy path and each error case

<!-- Integrating the PokéAPI w/ Edge Functions -->

Create a Supabase Edge Function called `get-pokemon`.

The function should:

- Accept a `name` query parameter (e.g. ?name=pikachu)
- Fetch that Pokémon from the PokéAPI at https://pokeapi.co/api/v2/pokemon/{name}
- Return only a trimmed JSON response containing the Pokémon's name and
  front_default sprite URL in this shape:
  { "name": "pikachu", "sprite": "https://..." }

Requirements:

- Include proper CORS headers so the function can be called from a browser
- Handle the case where the `name` parameter is missing — return a 400 with a
  descriptive error message
- Handle the case where the PokéAPI returns a non-OK response (Pokémon not found)
  — return a 404 with a descriptive error message
- Deploy the function when complete and provide curl commands to test the happy
  path, the missing parameter case, and the not-found case
