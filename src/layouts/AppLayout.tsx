import { NavLink, Outlet } from 'react-router-dom'

function AppLayout() {
  return (
    <div className="app-layout">
      <nav className="app-nav">
        <NavLink to="/home" className="app-nav-link">
          Home
        </NavLink>
        <NavLink to="/trips" className="app-nav-link">
          Trips
        </NavLink>
        <NavLink to="/profile" className="app-nav-link">
          Profile
        </NavLink>
      </nav>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
