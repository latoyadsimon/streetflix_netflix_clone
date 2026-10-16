import { Link } from 'react-router-dom'
import { useWatchlist } from '../context/WatchlistContext.jsx'
import './Hero.css'

export default function Hero({ title }) {
  const { has, toggle, notify } = useWatchlist()
  const saved = has(title.id)
  return (
    <section className="hero" aria-labelledby="hero-title">
      {title.backdrop && <img className="hero-img" src={title.backdrop} alt="" fetchPriority="high" />}
      <div className="hero-shade" />
      <div className="hero-sticker" aria-hidden="true">
        <svg viewBox="0 0 24 16" width="30" height="20"><path d="M1 15L0 3l6 5 6-7 6 7 6-5-1 12z" fill="currentColor" /></svg>
        <span>Queen&rsquo;s<br />pick</span>
      </div>
      <div className="hero-body">
        <p className="hero-tag">Featured tonight</p>
        <h1 id="hero-title">{title.title}</h1>
        <p className="hero-meta">{title.year} &bull; {title.rating} &bull; {title.runtime} &bull; {title.genres.slice(0, 3).join(', ')}</p>
        <p className="hero-desc">{title.description}</p>
        <div className="hero-actions">
          <button type="button" className="btn btn-primary"
            onClick={() => notify('Streaming is not part of this demo. Browse and build your list.')}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
            Play
          </button>
          <button type="button" className="btn btn-secondary" aria-pressed={saved} onClick={() => toggle(title)}>
            <span aria-hidden="true">{saved ? '✓' : '+'}</span>
            {saved ? 'In My List' : 'My List'}
          </button>
          <Link to={`/titles/${title.id}`} className="btn btn-secondary">More Info</Link>
        </div>
      </div>
    </section>
  )
}
