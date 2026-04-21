import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className="min-h-screen bg-paper">
      <Outlet />
    </div>
  )
}

export default Layout
