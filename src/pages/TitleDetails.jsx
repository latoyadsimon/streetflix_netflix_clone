import { Link, useParams } from 'react-router-dom'
import ContentRow from '../components/ContentRow.jsx'
import { PosterArt } from '../components/TitleCard.jsx'
import { useWatchlist } from '../context/WatchlistContext.jsx'
import { getTitle, relatedTo } from '../data/catalog.js'
import './TitleDetails.css'

export default function TitleDetails() {
  const { id } = useParams()
  const title = getTitle(id)
  const { has, toggle, notify } = useWatchlist()

  if (!title) {
    return (
      <div className="page details-missing">
        <h1>Title not found</h1>
        <p>We couldn&rsquo;t find that title. It may have been removed or the link is wrong.</p>
        <Link to="/movies" className="btn btn-primary">Browse movies</Link>
        <Link to="/tv-shows" className="btn btn-secondary">Browse TV shows</Link>
      </div>
    )
  }

  const saved = has(title.id)
  const related = relatedTo(title)

  return (
    <div className="details">
      <section className="details-hero" aria-labelledby="details-title">
        {title.backdrop && <img className="details-backdrop" src={title.backdrop} alt="" fetchPriority="high" />}
        <div className="details-shade" />
        <div className="details-inner">
          <div className="details-poster"><PosterArt title={title} /></div>
          <div className="details-info">
            <h1 id="details-title">{title.title}</h1>
            {title.tagline && <p className="details-tagline">{title.tagline}</p>}
            <p className="details-meta">
              <span>{title.year}</span>
              <span className="details-rating">{title.rating}</span>
              {title.runtime && <span>{title.runtime}</span>}
              <span>{title.type === 'show' ? 'TV Show' : 'Movie'}</span>
            </p>
            <p className="details-genres">{title.genres.join(', ')}</p>
            <p className="details-desc">{title.description}</p>
            <div className="details-actions">
              <button type="button" className="btn btn-primary"
                onClick={() => notify('Streaming is not part of this demo. Browse and build your list.')}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
                Play
              </button>
              <button type="button" className={`btn btn-secondary${saved ? ' is-saved' : ''}`} aria-pressed={saved} onClick={() => toggle(title)}>
                <span aria-hidden="true">{saved ? '✓' : '+'}</span>
                {saved ? 'In My List' : 'My List'}
                <span className="sr-only">{saved ? ' (press to remove from My List)' : ' (add to My List)'}</span>
              </button>
              {saved && (
                <button type="button" className="details-remove" onClick={() => toggle(title)}>Remove from My List</button>
              )}
            </div>
          </div>
        </div>
      </section>
      <div className="details-more">
        <ContentRow heading="More Like This" titles={related} />
      </div>
    </div>
  )
}
