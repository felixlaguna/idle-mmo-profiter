<script setup lang="ts">
import { ref } from 'vue'

const appVersion = ref('1.0.0')
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">IdleMMO Profit Calculator</h1>
        <span class="app-version">v{{ appVersion }}</span>
      </div>
    </header>

    <main class="app-main">
      <div class="content-wrapper">
        <div class="placeholder">
          <h2>Welcome to IdleMMO Profit Calculator</h2>
          <p>Project scaffolded successfully. Ready for implementation.</p>
        </div>
      </div>
    </main>

    <footer class="app-footer">
      <p>Built with Vue 3 + TypeScript + Vite</p>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-title {
  font-size: 1.5rem;
  color: var(--text-accent);
  font-weight: 700;
}

.app-version {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.app-main {
  flex: 1;
  padding: 2rem;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.placeholder {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 3rem;
  text-align: center;
}

.placeholder h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.placeholder p {
  color: var(--text-secondary);
  font-size: 1rem;
}

.app-footer {
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 1rem 2rem;
  text-align: center;
}

.app-footer p {
  color: var(--text-secondary);
  font-size: 0.875rem;
}
</style>
