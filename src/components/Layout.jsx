import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5ece0' }}>
      <Outlet />
    </div>
  )
}

export default Layout
