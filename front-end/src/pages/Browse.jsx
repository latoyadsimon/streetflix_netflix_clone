import { useCatalog } from '../context/CatalogContext.jsx'
import TitleCard from '../components/TitleCard.jsx'
import '../components/BrowsePage.css'
import './Browse.css'

// Alphabetical by title, ignoring a leading "The ".
const sortKey = (t) => t.title.replace(/^the\s+/i, '').toLowerCase()
const groupLetter = (t) => {
  const c = sortKey(t)[0].toUpperCase()
  return /[A-Z]/.test(c) ? c : '#'
}

export default function Browse() {
  const { CATALOG } = useCatalog()
  const sorted = [...CATALOG].sort((a, b) => sortKey(a).localeCompare(sortKey(b), 'en', { numeric: true }))
  const groups = []
  for (const t of sorted) {
    const letter = groupLetter(t)
    const last = groups[groups.length - 1]
    if (last?.letter === letter) last.items.push(t)
    else groups.push({ letter, items: [t] })
  }

  return (
    <div className="page">
      <h1>All Titles</h1>
      <p className="browse-intro">{sorted.length} movies and shows, A to Z.</p>
      {groups.length > 0 && (
        <nav className="az-jump" aria-label="Jump to letter">
          {groups.map((g) => <a key={g.letter} href={`#letter-${g.letter}`}>{g.letter}</a>)}
        </nav>
      )}
      {groups.map((g) => (
        <section key={g.letter} id={`letter-${g.letter}`} className="az-group" aria-label={`Titles starting with ${g.letter}`}>
          <h2 className="az-letter" aria-hidden="true">{g.letter}</h2>
          <ul className="browse-grid">
            {g.items.map((t) => <li key={t.id}><TitleCard title={t} /></li>)}
          </ul>
        </section>
      ))}
    </div>
  )
}
