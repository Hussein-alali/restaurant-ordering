import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import MenuPage from './pages/MenuPage'
import ItemDetailPage from './pages/ItemDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import ConfirmationPage from './pages/ConfirmationPage'
import MyOrdersPage from './pages/MyOrdersPage'
import BranchSelectorPage from './pages/BranchSelectorPage'

function App() {
  return (
    <Routes>
      <Route path="/branch" element={<BranchSelectorPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<MenuPage />} />
        <Route path="menu" element={<Navigate to="/" replace />} />
        <Route path="item/:id" element={<ItemDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="confirmation" element={<ConfirmationPage />} />
        <Route path="my-orders" element={<MyOrdersPage />} />
      </Route>
    </Routes>
  )
}

export default App