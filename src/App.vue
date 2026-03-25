<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { useAuthStore } from './stores/auth'
import { watch, onMounted } from 'vue'
import api from './api/client'

const authStore = useAuthStore()

const PUBLIC_VAPID_KEY = 'BKSOm97JPcBScTi7GphWfCXy4RKEO-coN7IhD_DigY_zVf-KwzOH44iSq441zMxrRLEGw5MsH4Xi47_JwLpgCTA';

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      const applicationServerKey = urlB64ToUint8Array(PUBLIC_VAPID_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // Enviar subscripción al backend
    await api.post('/notifications/subscribe', subscription);
    console.log('[Push] Suscrito a notificaciones exitosamente');
  } catch (err) {
    console.error('[Push] Error en la suscripción:', err);
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    subscribeToPush();
  }
});

watch(() => authStore.isAuthenticated, (newVal) => {
  if (newVal) {
    subscribeToPush();
  }
});
</script>

<template>
  <NavBar v-if="authStore.isAuthenticated" />
  <RouterView />
</template>

<style scoped>
</style>
