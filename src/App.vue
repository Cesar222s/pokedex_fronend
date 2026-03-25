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
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Service Worker o PushManager no soportado en este navegador');
    return;
  }
  try {
    console.log('\n📲 ========== SUBSCRIBING TO PUSH ==========');
    
    const permission = await Notification.requestPermission();
    console.log('[Push] Notification permission:', permission);
    
    if (permission !== 'granted') {
      console.warn('[Push] ❌ Notification permission denied by user');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    console.log('[Push] Service Worker ready');
    
    let subscription = await registration.pushManager.getSubscription();
    console.log('[Push] Existing subscription:', subscription ? '✅ Found' : '❌ None');
    
    if (!subscription) {
      console.log('[Push] Creating new subscription...');
      const applicationServerKey = urlB64ToUint8Array(PUBLIC_VAPID_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      console.log('[Push] ✅ New subscription created');
    }

    console.log('[Push] Subscription endpoint:', subscription.endpoint.substring(0, 60) + '...');
    
    // Enviar subscripción al backend
    console.log('[Push] Sending subscription to backend...');
    await api.post('/notifications/subscribe', subscription);
    console.log('[Push] ✅ Suscrito a notificaciones exitosamente');
    console.log('📲 =====================================\n');
  } catch (err) {
    console.error('[Push] ❌ Error en la suscripción:', err.message);
    console.error('[Push] Error type:', err.name);
    console.error('[Push] Stack:', err.stack);
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
