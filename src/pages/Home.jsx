import ContentRow from '../components/ContentRow.jsx'
import { MOVIES, SHOWS } from '../data/catalog.js'

// Phase 1 preview only: rows exist to verify TitleCard. Replaced in Phase 2.
export default function Home() {
  return (
    <div className="page">
      <ContentRow heading="Popular Movies" titles={MOVIES} seeAllTo="/movies" />
      <ContentRow heading="Trending TV Shows" titles={SHOWS} seeAllTo="/tv-shows" />
    </div>
  )
}
