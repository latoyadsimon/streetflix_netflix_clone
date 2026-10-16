import { useWatchlist } from '../context/WatchlistContext.jsx'
import './Toast.css'

export default function Toast() {
  const { toast } = useWatchlist()
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && <p key={toast.key} className="toast">{toast.message}</p>}
    </div>
  )
}
