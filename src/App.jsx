import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Movies from './pages/Movies.jsx'
import TvShows from './pages/TvShows.jsx'
import Browse from './pages/Browse.jsx'
import Search from './pages/Search.jsx'
import TitleDetails from './pages/TitleDetails.jsx'
import Watchlist from './pages/Watchlist.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="movies" element={<Movies />} />
        <Route path="tv-shows" element={<TvShows />} />
        <Route path="browse" element={<Browse />} />
        <Route path="search" element={<Search />} />
        <Route path="titles/:id" element={<TitleDetails />} />
        <Route path="watchlist" element={<Watchlist />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
