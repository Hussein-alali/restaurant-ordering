import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import ConfirmationPage from './pages/ConfirmationPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<MenuPage />} />
        <Route path="menu" element={<Navigate to="/" replace />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="confirmation" element={<ConfirmationPage />} />
      </Route>
    </Routes>
  )
}

export default App