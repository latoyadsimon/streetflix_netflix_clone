import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import TitleCard from './TitleCard.jsx'
import './BrowsePage.css'

const PAGE_SIZE = 8

function BrowseGrid({ titles, noun, emptyMessage, onClear, showClear }) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const shown = titles.slice(0, visible)

  if (!titles.length) {
    return (
      <div className="browse-empty">
        <p>{emptyMessage}</p>
        {showClear && <button type="button" className="btn btn-secondary" onClick={onClear}>Clear filter</button>}
      </div>
    )
  }
  return (
    <>
      <ul className="browse-grid">
        {shown.map((t) => <li key={t.id}><TitleCard title={t} /></li>)}
      </ul>
      <p className="browse-count" aria-live="polite">Showing {shown.length} of {titles.length} {noun}</p>
      {visible < titles.length && (
        <button type="button" className="btn btn-secondary browse-more" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
          Load More
        </button>
      )}
    </>
  )
}

export default function BrowsePage({ heading, noun, titles, emptyMessage, filterEmptyMessage }) {
  const [params, setParams] = useSearchParams()
  const genre = params.get('genre') || ''
  const genres = [...new Set(titles.flatMap((t) => t.genres))].sort()
  const filtered = genre ? titles.filter((t) => t.genres.includes(genre)) : titles

  const setGenre = (value) => setParams(value ? { genre: value } : {}, { replace: true })

  return (
    <div className="page">
      <h1>{heading}</h1>
      {titles.length > 0 && (
        <div className="browse-filter">
          <label htmlFor="genre-filter">Genre:</label>
          <select id="genre-filter" value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">All Genres</option>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
            {genre && !genres.includes(genre) && <option value={genre}>{genre}</option>}
          </select>
        </div>
      )}
      <BrowseGrid
        key={genre}
        titles={filtered}
        noun={noun}
        emptyMessage={genre ? filterEmptyMessage : emptyMessage}
        showClear={Boolean(genre)}
        onClear={() => setGenre('')}
      />
      {!titles.length && <Link to="/" className="btn btn-primary browse-home">Back to Home</Link>}
    </div>
  )
}
