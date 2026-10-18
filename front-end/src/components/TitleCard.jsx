import { useState } from 'react'
import { Link } from 'react-router-dom'
import './TitleCard.css'

// Real poster when available; generated art is the consistent fallback (missing or broken image).
export function PosterArt({ title }) {
  const [state, setState] = useState('loading')
  if (title.poster && state !== 'failed') {
    return (
      <>
        {state === 'loading' && <span className="poster-skeleton" aria-hidden="true" />}
        <img ref={(img) => { if (img?.complete && img.naturalWidth > 0) setState('loaded') }}
          className={`poster-img${state === 'loaded' ? ' is-loaded' : ''}`} src={title.poster}
          alt={`Poster for ${title.title}`} loading="lazy" decoding="async" width="780" height="1170"
          onLoad={() => setState('loaded')} onError={() => setState('failed')} />
      </>
    )
  }
  return (
    <div className="poster-art" style={{ '--h': title.hue }} role="img" aria-label={`Poster for ${title.title}`}>
      <span className="poster-art-letter" aria-hidden="true">{title.title[0]}</span>
    </div>
  )
}

export default function TitleCard({ title, onRemove }) {
  return (
    <article className="title-card" style={{ '--tilt': `${((title.hue % 5) - 2) * 0.6}deg` }}>
      <Link to={`/titles/${title.id}`} className="title-card-link">
        <div className="title-card-poster">
          <PosterArt title={title} />
          <div className="title-card-overlay" aria-hidden="true">
            <p>{title.genres.join(', ')}</p>
            <span>View details</span>
          </div>
        </div>
        <p className="title-card-title">{title.title}</p>
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
