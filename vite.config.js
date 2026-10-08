import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // এটি খুব গুরুত্বপূর্ণ! এটি না দিলে ব্রাউজার JS/CSS ফাইল খুঁজে পায় না।
})
