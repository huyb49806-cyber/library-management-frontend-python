import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import App from './App'
import { store } from './store'
import './styles.css'

createRoot(document.getElementById('root')).render(<React.StrictMode><Provider store={store}><ConfigProvider locale={viVN} theme={{ token: { colorPrimary: '#0b7165', borderRadius: 10, fontFamily: 'Inter, system-ui, sans-serif' } }}><BrowserRouter><App /></BrowserRouter></ConfigProvider></Provider></React.StrictMode>)
