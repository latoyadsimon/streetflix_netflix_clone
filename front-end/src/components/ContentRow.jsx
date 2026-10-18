import { Link } from 'react-router-dom'
import TitleCard from './TitleCard.jsx'
import './ContentRow.css'

export default function ContentRow({ heading, titles, seeAllTo }) {
  if (!titles.length) return null
  const id = `row-${heading.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <section className="content-row" aria-labelledby={id}>
      <div className="content-row-head">
        <h2 id={id}>{heading}</h2>
        {seeAllTo && <Link to={seeAllTo} className="content-row-all">See All</Link>}
      </div>
      <ul className="content-row-track">
        {titles.map((t) => (
          <li key={t.id}><TitleCard title={t} /></li>
        ))}
      </ul>
    </section>
  )
}
