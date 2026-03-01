import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Create and mount the app
const app = createApp(App)
app.mount('#app')

// Remove loading skeleton after Vue has mounted
const loadingElement = document.getElementById('app-loading')
if (loadingElement) {
  // Add fade-out class for smooth transition
  loadingElement.classList.add('fade-out')
  // Remove from DOM after transition completes
  setTimeout(() => {
    loadingElement.remove()
  }, 300)
}
