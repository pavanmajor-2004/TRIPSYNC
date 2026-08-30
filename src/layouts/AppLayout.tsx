import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { signOutUser } from '../services/auth'

function AppLayout() {
  const navigate = useNavigate()

  async function handleLogout() {
    await signOutUser()
    navigate('/login', { replace: true })
  }

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
        <button type="button" className="app-nav-logout" onClick={handleLogout}>
          Log out
        </button>
      </nav>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
