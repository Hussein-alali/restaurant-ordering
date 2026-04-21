import { createContext, useContext, useReducer } from 'react'

const CartContext = createContext(null)

const initialState = {
  items: [],
  serviceType: 'Delivery',
  customer: {
    name: '',
    phone: '',
    address: '',
    building: '',
    deliveryNotes: '',
  },
  lastOrder: null,
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(item => item.id === action.payload.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      }
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      }
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.id),
        }
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      }
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        lastOrder: state.lastOrder,
      }
    case 'SET_SERVICE_TYPE':
      return { ...state, serviceType: action.payload }
    case 'SET_CUSTOMER':
      return {
        ...state,
        customer: { ...state.customer, ...action.payload },
      }
    case 'SET_LAST_ORDER':
      return {
        ...state,
        lastOrder: action.payload,
      }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function formatPayload(cartState) {
  const { serviceType, customer } = cartState
  const addressParts = [customer.address, customer.building].filter(Boolean)
  const address = serviceType === 'Delivery' ? addressParts.join(', ') : serviceType
  return {
    customerName: customer.name,
    phone: customer.phone,
    serviceType,
    address,
    items: cartState.items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    totalPrice: calculateTotal(cartState.items),
    deliveryNotes: customer.deliveryNotes,
    timestamp: new Date().toISOString(),
  }
}

export function validateForm(data, serviceType = 'Delivery') {
  const errors = {}
  if (!data.name?.trim()) errors.name = 'Name is required'
  if (!data.phone?.trim()) errors.phone = 'Phone is required'
  else if (!/^\+?[\d\s\-().]{7,}$/.test(data.phone)) errors.phone = 'Invalid phone format'
  if (serviceType === 'Delivery' && !data.address?.trim()) errors.address = 'Address is required'
  return errors
}