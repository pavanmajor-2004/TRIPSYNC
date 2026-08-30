import { Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import HomePage from '../pages/HomePage'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import ProfilePage from '../pages/ProfilePage'
import SignupPage from '../pages/SignupPage'
import TripPage from '../pages/TripPage'
import TripsPage from '../pages/TripsPage'
import ProtectedRoute from './ProtectedRoute'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/trip/:tripId" element={<TripPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
