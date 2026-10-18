import { useEffect, useRef, useState } from 'react'
import './Player.css'

// Free, embeddable sources only: YouTube and the Internet Archive.
// eslint-disable-next-line react-refresh/only-export-components
export function embedUrl(source) {
  if (!source) return null
  const yt = source.url.match(/[?&]v=([\w-]+)/)
  if (source.provider === 'youtube' && yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0`
  const ia = source.url.match(/archive\.org\/details\/([^/?#]+)/)
  if (source.provider === 'archive' && ia) return `https://archive.org/embed/${ia[1]}`
  return null
}

// mode: 'trailer' plays title.trailer; 'watch' plays the full title (episode picker for shows).
export default function Player({ title, mode, onClose }) {
  const dialog = useRef(null)
  const frame = useRef(null)
  const [episode, setEpisode] = useState(0)

  useEffect(() => {
    const el = dialog.current
    if (el && !el.open) el.showModal()
  }, [])

  const episodes = mode === 'watch' && title.episodes?.length > 1 ? title.episodes : null
  const source = mode === 'trailer' ? title.trailer : episodes ? episodes[episode] : title.watch
  const src = embedUrl(source)
  const current = episodes?.[episode]
  const label = mode === 'trailer' ? `${title.title} trailer`
    : current ? `${title.title}: ${current.season ? `${current.season}, ` : ''}${current.title}` : title.title

  // Group episodes by season, remembering each one's index in the flat list.
  const seasons = []
  episodes?.forEach((ep, i) => {
    let group = seasons.find((s) => s.name === (ep.season || ''))
    if (!group) { group = { name: ep.season || '', items: [] }; seasons.push(group) }
    group.items.push({ ep, i })
  })

  const fullscreen = () => { frame.current?.requestFullscreen?.() }

  return (
    <dialog ref={dialog} className="player" aria-label={label} onClose={onClose}
      onClick={(e) => { if (e.target === dialog.current) dialog.current.close() }}>
      <div className="player-bar">
        <h2 className="player-title">{label}</h2>
        <div className="player-bar-actions">
          <button type="button" className="player-btn" onClick={fullscreen}>Full screen</button>
          <button type="button" className="player-btn" onClick={() => dialog.current.close()} autoFocus>Close</button>
        </div>
      </div>
      <div className="player-stage">
        {src ? (
          <iframe ref={frame} key={src} src={src} title={label}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen />
        ) : (
          <p className="player-error">This video isn&rsquo;t available right now.</p>
        )}
      </div>
      {episodes && (
        <div className="player-episodes-wrap">
          {seasons.map(({ name, items }) => (
            <section key={name || 'all'} aria-label={name || 'Episodes'}>
              {name && <h3 className="player-season">{name}</h3>}
              <ul className="player-episodes">
                {items.map(({ ep, i }) => (
                  <li key={ep.url}>
                    <button type="button" className={`player-ep${i === episode ? ' is-current' : ''}`}
                      aria-current={i === episode ? 'true' : undefined} onClick={() => setEpisode(i)}>
                      {ep.title}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <p className="player-note">
        Free to watch via {source?.provider === 'archive' ? 'the Internet Archive' : 'YouTube'}.
        {source && (
          <> Trouble playing? <a href={source.url} target="_blank" rel="noreferrer">Open it in a new tab</a>.</>
        )}
      </p>
    </dialog>
  )
}
