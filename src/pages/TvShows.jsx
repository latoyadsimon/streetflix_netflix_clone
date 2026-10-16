import BrowsePage from '../components/BrowsePage.jsx'
import { SHOWS } from '../data/catalog.js'

export default function TvShows() {
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
