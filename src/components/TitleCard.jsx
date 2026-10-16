import { Link } from 'react-router-dom'
import './TitleCard.css'

// Generated poster art: also serves as the fallback for any title without an image.
export function PosterArt({ title, className = '' }) {
  const h = title.hue
  return (
    <div
      className={`poster-art ${className}`}
      style={{ '--h': h }}
      role="img"
      aria-label={`Poster for ${title.title}`}
    >
      <span className="poster-art-letter" aria-hidden="true">{title.title[0]}</span>
      <span className="poster-art-tag" aria-hidden="true">{title.type === 'show' ? 'series' : 'film'}</span>
    </div>
  )
}

export default function TitleCard({ title, onRemove }) {
  return (
    <article className="title-card">
      <Link to={`/titles/${title.id}`} className="title-card-link">
        <div className="title-card-poster">
          <PosterArt title={title} />
          <div className="title-card-overlay" aria-hidden="true">
            <p>{title.genres.join(', ')}</p>
            <span>View details</span>
          </div>
        </div>
        <h3 className="title-card-title">{title.title}</h3>
        <p className="title-card-meta">{title.year} &bull; {title.rating}</p>
      </Link>
      {onRemove && (
        <button type="button" className="title-card-remove" onClick={() => onRemove(title)}
          aria-label={`Remove ${title.title} from My List`}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      )}
    </article>
  )
}
