import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
console.log('API Base URL:', baseUrl)

export const apiSlice = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as { auth: { token: string | null } }).auth?.token
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Empire', 'Planet', 'Fleet', 'Signal', 'Alliance', 'Universe', 'Defence', 'Facility', 'Research', 'Ship', 'Mail', 'Resource', 'Buildable', 'ConstructionQueue', 'Fund', 'CombatLog', 'User', 'Tick', 'Statistics', 'Role', 'Announcement', 'QuantumCredits', 'Booster', 'Achievement', 'Chat', 'Market', 'MarketOrder', 'MarketTrade', 'CombatSimulation', 'TickTest', 'Definition', 'DefinitionVersion', 'Incident'],
  // Enable automatic refetching when tags are invalidated
  refetchOnFocus: false, // We handle this via WebSocket
  refetchOnReconnect: true,
  endpoints: () => ({}),
})

