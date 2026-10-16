import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p style={{ color: 'var(--text-muted)' }}>That URL doesn't lead anywhere. Head back to the good stuff.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  )
}
