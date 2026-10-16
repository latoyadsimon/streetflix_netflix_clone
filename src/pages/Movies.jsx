import BrowsePage from '../components/BrowsePage.jsx'
import { MOVIES } from '../data/catalog.js'

export default function Movies() {
  return (
    <BrowsePage
      heading="Movies"
      noun="movies"
      titles={MOVIES}
      emptyMessage="No movies available right now."
      filterEmptyMessage="No movies found in this category."
    />
  )
}
