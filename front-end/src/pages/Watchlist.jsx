import { useRef } from 'react'
import { Link } from 'react-router-dom'
import TitleCard from '../components/TitleCard.jsx'
import { useWatchlist } from '../context/WatchlistContext.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'
import './Watchlist.css'

export default function Watchlist() {
  const { ids, loading, remove } = useWatchlist()
  const { getTitle } = useCatalog()
  const heading = useRef(null)
  const titles = ids.map(getTitle).filter(Boolean)

  // The removed card unmounts, so hand keyboard focus back to the page heading.
  const handleRemove = (title) => {
    remove(title)
    heading.current?.focus()
  }

  return (
    <div className="page">
      <div className="watchlist-head">
        <h1 ref={heading} tabIndex={-1}>My List</h1>
        <Link to="/browse" className="btn btn-primary">Browse Titles</Link>
      </div>
      {loading ? null : titles.length > 0 ? (
        <>
          <p className="watchlist-count">{titles.length} saved {titles.length === 1 ? 'title' : 'titles'}</p>
          <ul className="browse-grid">
            {titles.map((t) => (
              <li key={t.id}><TitleCard title={t} onRemove={handleRemove} /></li>
            ))}
          </ul>
        </>
      ) : (
        <div className="watchlist-empty">
          <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 18L2 7l5 4 5-7 5 7 5-4-1 11z" /></svg>
          <h2>Your list is empty</h2>
          <p>Save movies and TV shows to watch later. Your throne is waiting.</p>
          <Link to="/browse" className="btn btn-primary">Browse Titles</Link>
        </div>
      )}
    </div>
  )
}
