User Journey — Netflix Clone
What it is: A streaming-platform-inspired web app where users browse movies and TV shows, search for titles, view title details, and manage a personal watchlist.
Problem: Users need an easy way to discover movies and TV shows, explore content, and keep track of what they want to watch in one place.
User: One type — a viewer who wants to discover entertainment and organize their watchlist.
The journey
1. Opens the app → lands on Home (/). Sees a featured movie or TV show, popular titles, and content organized into categories.
- First visit: Home displays available catalog titles and a featured title.
- Empty catalog: Shows a friendly message, "No titles available right now."
2. Browses movies → navigates to Browse Movies (/movies). Sees a grid of movie posters and can filter by genre.
- Taps a movie poster → navigates to its Title Details page.
- No movies match the selected genre → displays "No movies found in this category."
3. Browses TV shows → navigates to Browse TV Shows (/tv-shows). Sees a collection of TV shows organized by genre.
- Taps a show → navigates to its Title Details page.
- No shows are available → displays a friendly empty state.
4. Searches for content → enters a title into the search bar and submits the query → navigates to Search Results (/search?q=:query).
- Matching titles: Displays movies and TV shows matching the search.
- No matches: Displays "No results found for your search" with an option to try another search.
- Empty search: Does not submit an empty query.
5. Views title details → selects a movie or TV show → navigates to Title Details (/titles/:id). Sees the poster or backdrop, title, description, release year, genre, maturity rating, and runtime when available.
- Taps Add to My List → saves the title to their watchlist and updates the button to indicate it has been added.
- Taps Remove from My List → removes the title from their watchlist.
- Invalid title ID → displays "Title not found" with a link back to browsing.
- Title is already saved → does not create a duplicate watchlist entry.
6. Manages their watchlist → navigates to My Watchlist (/watchlist). Sees all saved movies and TV shows.
- Taps a title → opens its Title Details page.
- Removes a title → the title disappears from the watchlist.
- Empty watchlist → displays "Your list is empty" with a button to browse titles.
- Refreshes the page → saved data remains available if persistence is implemented.
7. Navigates between pages → uses the navigation bar to access Home, Movies, TV Shows, Search, and My Watchlist.
- The current page is visually highlighted.
- Browser back and forward navigation work as expected.
8. Visits an unknown URL → sees a friendly 404 Not Found page with a link back to Home.
Data rules
- Frontend: React manages the user interface and temporary interaction state.
- Backend: An API serves the catalog and handles watchlist operations if the project uses a backend.
- Database: PostgreSQL stores titles, user accounts when authentication is implemented, and watchlist relationships.
- Catalog: Movies and TV shows are shared content available to all viewers.
- Watchlist: Each watchlist belongs to its respective user. Users must not access or modify another user's saved titles.
- Persistence: Watchlist changes should remain saved after refreshing the page when connected to the backend.
- Initial data: Seed the catalog with sample movies and TV shows so the app is populated on the first visit.
- Scope: This version is a catalog and watchlist application. Actual video streaming, subscription payments, and personalized recommendation algorithms are outside the initial scope.




