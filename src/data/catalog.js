// Seed catalog. Fictional titles; art is generated from `hue` (no external images).
// [id, type, title, year, rating, runtime, genres, hue, description]
const RAW = [
  ['m1', 'movie', 'Neon Crown', 2024, 'PG-13', '1h 52m', ['Action', 'Drama'], 345, 'A street racer rebuilds her crew after a rival takes over the city\'s midnight circuit.'],
  ['m2', 'movie', 'Spray Paint Heist', 2023, 'R', '2h 04m', ['Action', 'Comedy'], 20, 'Four artists plan to tag the one wall in town that is guarded like a bank vault.'],
  ['m3', 'movie', 'Queens of Concrete', 2022, 'PG-13', '1h 47m', ['Drama'], 290, 'Three sisters inherit a failing roller rink and turn it into the neighborhood\'s loudest stage.'],
  ['m4', 'movie', 'Alley Cat', 2021, 'PG', '1h 31m', ['Comedy', 'Sci-Fi'], 160, 'A stray cat discovers an alley that leads to a different city every night.'],
  ['m5', 'movie', 'Last Train Uptown', 2024, 'R', '2h 11m', ['Thriller', 'Drama'], 220, 'One subway ride, one stolen bag, and a dispatcher who knows too much.'],
  ['m6', 'movie', 'Boombox', 2020, 'PG-13', '1h 40m', ['Comedy', 'Drama'], 45, 'A summer of block parties tests a crew of friends and the DJ who holds them together.'],
  ['m7', 'movie', 'Chrome Hearts', 2023, 'PG-13', '1h 58m', ['Sci-Fi', 'Action'], 200, 'A mechanic wires a retired android back to life, and the city\'s owners want it back.'],
  ['m8', 'movie', 'Fire Escape', 2019, 'PG-13', '1h 36m', ['Drama', 'Thriller'], 10, 'A rooftop confession turns into a night-long chase across the skyline.'],
  ['m9', 'movie', 'Glitter & Gravel', 2022, 'PG', '1h 44m', ['Comedy'], 320, 'A rhinestone-obsessed mechanic enters a demolition derby to save her garage.'],
  ['m10', 'movie', 'The Understudy Queen', 2021, 'PG-13', '1h 55m', ['Drama', 'Comedy'], 275, 'The understudy takes the lead on opening night and refuses to give it back.'],
  ['m11', 'movie', 'Dead End Dreams', 2018, 'R', '2h 02m', ['Thriller'], 250, 'A cold case on a dead-end street reopens when a mural is painted over.'],
  ['m12', 'movie', 'Midnight Mural', 2024, 'PG-13', '1h 49m', ['Action', 'Sci-Fi'], 180, 'A painting on a brick wall starts predicting the future, and the future is not kind.'],
  ['s1', 'show', 'Block Party Chronicles', 2024, 'TV-14', '3 seasons', ['Comedy', 'Drama'], 35, 'One block, one summer, and everyone has a secret worth a verse.'],
  ['s2', 'show', 'Throne Room', 2023, 'TV-MA', '2 seasons', ['Drama', 'Thriller'], 350, 'Five women fight for control of a family-run empire after the founder steps down.'],
  ['s3', 'show', 'Graffiti Division', 2022, 'TV-14', '4 seasons', ['Action', 'Thriller'], 15, 'A city task force chases the artist behind the tags, and keeps getting outsmarted.'],
  ['s4', 'show', 'Rooftop Radio', 2021, 'TV-PG', '2 seasons', ['Comedy'], 55, 'Two friends run a pirate radio station out of a water tower.'],
  ['s5', 'show', 'Sirens & Synths', 2024, 'TV-14', '1 season', ['Sci-Fi', 'Drama'], 270, 'In a city powered by music, a producer finds a sound that shuts everything down.'],
  ['s6', 'show', 'The Hustle Sisters', 2020, 'TV-PG', '5 seasons', ['Comedy', 'Drama'], 300, 'Three sisters, six side gigs, and one very stubborn grandmother.'],
  ['s7', 'show', 'Underground Royalty', 2023, 'TV-MA', '3 seasons', ['Drama', 'Action'], 330, 'Behind the nightclub doors, an underground ballroom scene turns into a power struggle.'],
  ['s8', 'show', 'Asphalt Angels', 2019, 'TV-14', '2 seasons', ['Action', 'Drama'], 195, 'A motorcycle crew of women patrols the city after dark, no badges required.'],
  ['s9', 'show', 'Wheatpaste', 2022, 'TV-14', '2 seasons', ['Thriller', 'Sci-Fi'], 130, 'Posters appear overnight with warnings about tomorrow, and they are always right.'],
  ['s10', 'show', 'Crown Heights Kitchen', 2021, 'TV-PG', '3 seasons', ['Comedy', 'Drama'], 25, 'A corner-store kitchen becomes the most talked-about restaurant in the borough.'],
  ['s11', 'show', 'Signal Lost', 2024, 'TV-14', '1 season', ['Sci-Fi', 'Thriller'], 215, 'When every phone in the city goes dark, neighbors have to learn each other\'s names.'],
  ['s12', 'show', 'Pavement Poets', 2020, 'TV-PG', '2 seasons', ['Drama'], 305, 'An open-mic night in a laundromat changes five lives, one verse at a time.'],
]

export const CATALOG = RAW.map(([id, type, title, year, rating, runtime, genres, hue, description]) => ({
  id, type, title, year, rating, runtime, genres, hue, description,
}))

export const MOVIES = CATALOG.filter((t) => t.type === 'movie')
export const SHOWS = CATALOG.filter((t) => t.type === 'show')
export const GENRES = [...new Set(CATALOG.flatMap((t) => t.genres))].sort()

export const getTitle = (id) => CATALOG.find((t) => t.id === id)

export const relatedTo = (title, limit = 8) =>
  CATALOG.filter((t) => t.id !== title.id && t.genres.some((g) => title.genres.includes(g))).slice(0, limit)
