<script setup lang="ts">
const pages = [
  { to: '/', label: 'Home' },
  { to: '/rationalCubic', label: 'Rational Cubic' },
]
</script>

<template>
  <div class="shell">
    <nav class="nav">
      <h1>Curvy Playground</h1>
      <div class="nav-links">
        <NuxtLink v-for="p in pages" :key="p.to" :to="p.to">{{ p.label }}</NuxtLink>
      </div>
    </nav>
    <main>
      <NuxtPage />
    </main>
  </div>
</template>
