import { Link } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import ContentRow from '../components/ContentRow.jsx'
import { CATALOG, MOVIES, SHOWS, getTitle } from '../data/catalog.js'
import './Home.css'

const FEATURED_ID = 's1'
const ANIME = CATALOG.filter((t) => t.genres.includes('Anime'))
const ANIMATED_FILMS = MOVIES.filter((t) => t.genres.includes('Animation'))
const CATEGORIES = [
  { genre: 'Anime', to: '/tv-shows' },
  { genre: 'Animation', to: '/movies' },
  { genre: 'Comedy', to: '/movies' },
  { genre: 'Sci-Fi', to: '/movies' },
  { genre: 'Western', to: '/movies' },
]

export default function Home() {
  if (!CATALOG.length) {
    return (
      <div className="page">
        <p className="home-empty">No titles available right now.</p>
      </div>
    )
  }
  const featured = getTitle(FEATURED_ID) ?? CATALOG[0]
  return (
    <div className="page home">
      <Hero title={featured} />
      <ContentRow heading="Popular Movies" titles={MOVIES.slice(0, 12)} seeAllTo="/movies" />
      <ContentRow heading="Trending TV Shows" titles={SHOWS.slice(0, 12)} seeAllTo="/tv-shows" />
      <ContentRow heading="Anime" titles={ANIME.slice(0, 12)} seeAllTo="/tv-shows?genre=Anime" />
      <ContentRow heading="Animated Films" titles={ANIMATED_FILMS.slice(0, 12)} seeAllTo="/movies?genre=Animation" />
      <section className="categories" aria-labelledby="cat-heading">
        <h2 id="cat-heading">Browse by Category</h2>
        <ul>
          {CATEGORIES.map(({ genre, to }) => (
            <li key={genre}>
              <Link to={`${to}?genre=${encodeURIComponent(genre)}`} className="category-btn">{genre}</Link>
            </li>
          ))}
          <li><Link to="/browse" className="category-btn">All A&ndash;Z</Link></li>
        </ul>
      </section>
    </div>
  )
}
