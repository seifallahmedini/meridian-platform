import { Client } from './generated-client'

export * from './generated-client'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5299'

export const apiClient = new Client(baseUrl)
