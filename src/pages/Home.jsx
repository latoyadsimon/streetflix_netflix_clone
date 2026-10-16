import { Link } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import ContentRow from '../components/ContentRow.jsx'
import { CATALOG, MOVIES, SHOWS, getTitle } from '../data/catalog.js'
import './Home.css'

const FEATURED_ID = 'm10'
const CATEGORIES = ['Action', 'Comedy', 'Drama', 'Sci-Fi']

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
      <section className="categories" aria-labelledby="cat-heading">
        <h2 id="cat-heading">Browse by Category</h2>
        <ul>
          {CATEGORIES.map((g) => (
            <li key={g}>
              <Link to={`/movies?genre=${encodeURIComponent(g)}`} className="category-btn">{g}</Link>
            </li>
          ))}
          <li><Link to="/browse" className="category-btn">All A&ndash;Z</Link></li>
        </ul>
      </section>
    </div>
  )
}
