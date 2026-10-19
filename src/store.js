import { configureStore, createSlice } from '@reduxjs/toolkit'
const authSlice = createSlice({ name: 'auth', initialState: { user: null, access: null, refresh: null }, reducers: { setSession: (s, a) => { s.user = a.payload.user; s.access = a.payload.access; s.refresh = a.payload.refresh }, clearSession: (s) => { s.user = null; s.access = null; s.refresh = null } } })
const uiSlice = createSlice({ name: 'ui', initialState: { collapsed: false }, reducers: { toggleSidebar: (s) => { s.collapsed = !s.collapsed } } })
export const { setSession, clearSession } = authSlice.actions
export const { toggleSidebar } = uiSlice.actions
export const store = configureStore({ reducer: { auth: authSlice.reducer, ui: uiSlice.reducer } })
