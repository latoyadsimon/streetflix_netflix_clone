import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="page not-found">
      <p className="nf-tag" aria-hidden="true">404</p>
      <h1>Page not found</h1>
      <p className="nf-copy">Wrong wall. That URL doesn&rsquo;t lead anywhere, so head back to the good stuff.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  )
}
