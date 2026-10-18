import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import TitleCard from '../components/TitleCard.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'
import './Search.css'

const matches = (list, q) => list.filter((t) => t.title.toLowerCase().includes(q.toLowerCase()))

function SearchBar({ initial, onSubmit }) {
  const [value, setValue] = useState(initial)
  const [hint, setHint] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const q = value.trim()
    if (!q) {
      setHint('Enter a title to search.')
      return
    }
    setHint('')
    onSubmit(q)
  }

  return (
    <form className="search-bar" role="search" onSubmit={submit} noValidate>
      <div className="search-field">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5" /></svg>
        <input
          type="search" name="q" value={value} autoFocus={!initial}
          onChange={(e) => { setValue(e.target.value); if (hint) setHint('') }}
          placeholder="Search movies and shows..." aria-label="Search movies and shows"
          aria-describedby={hint ? 'search-hint' : undefined} aria-invalid={Boolean(hint)}
        />
        {value && (
          <button type="button" className="search-clear" aria-label="Clear search"
            onClick={() => { setValue(''); setHint('') }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3"
              strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        )}
      </div>
      <button type="submit" className="btn btn-primary">Search</button>
      {hint && <p id="search-hint" className="search-hint" role="alert">{hint}</p>}
    </form>
  )
}

function ResultSection({ heading, titles }) {
  if (!titles.length) return null
  return (
    <section className="search-section" aria-label={heading}>
      <h2>{heading} ({titles.length})</h2>
      <ul className="browse-grid">
        {titles.map((t) => <li key={t.id}><TitleCard title={t} /></li>)}
      </ul>
    </section>
  )
}

export default function Search() {
  const { MOVIES, SHOWS } = useCatalog()
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') || '').trim()
  const movies = q ? matches(MOVIES, q) : []
  const shows = q ? matches(SHOWS, q) : []
  const total = movies.length + shows.length

  return (
    <div className="page">
      <h1>Search</h1>
      <SearchBar key={q} initial={q} onSubmit={(next) => setParams({ q: next })} />

      {!q && (
        <p className="search-prompt">
          Type a title to find movies and TV shows, or <Link to="/browse">browse everything A to Z</Link>.
        </p>
      )}

      {q && total > 0 && (
        <>
          <p className="search-summary" aria-live="polite">Results for &ldquo;{q}&rdquo; ({total})</p>
          <ResultSection heading="Movies" titles={movies} />
          <ResultSection heading="TV Shows" titles={shows} />
        </>
      )}

      {q && total === 0 && (
        <div className="search-empty" aria-live="polite">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5" /></svg>
          <h2>No results found for your search</h2>
          <p>Nothing matches &ldquo;{q}&rdquo;. Try a different search term.</p>
          <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
      )}
    </div>
  )
}
