import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/freefire/', // আপনার Repo নাম অনুযায়ী এই স্ল্যাশ ও নাম দেওয়া আবশ্যক!
})
