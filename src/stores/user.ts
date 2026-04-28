// src/stores/user.ts
import { atom } from 'nanostores'

export interface StoreUser {
  id: string
  email: string
  name: string
  avatar: string
}

export const $user = atom<StoreUser | null>(null)