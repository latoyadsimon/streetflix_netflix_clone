import BrowsePage from '../components/BrowsePage.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'

export default function Movies() {
  const { MOVIES } = useCatalog()
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
