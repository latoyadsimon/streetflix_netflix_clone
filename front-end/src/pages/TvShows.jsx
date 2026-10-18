import BrowsePage from '../components/BrowsePage.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'

export default function TvShows() {
  const { SHOWS } = useCatalog()
  return (
    <BrowsePage
      heading="TV Shows"
      noun="shows"
      titles={SHOWS}
      emptyMessage="No shows available right now."
      filterEmptyMessage="No shows found in this category."
    />
  )
}
