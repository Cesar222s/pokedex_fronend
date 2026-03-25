import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/client'

export const useFriendsStore = defineStore('friends', () => {
  const friends = ref<any[]>([])
  const pending = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchFriends() {
    loading.value = true
    try {
      const res = await api.get('/friends')
      friends.value = res.data.friends
    } catch (err) {
      console.error('Fetch friends error:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchPending() {
    try {
      const res = await api.get('/friends/pending')
      pending.value = res.data.pending
    } catch (err) {
      console.error('Fetch pending error:', err)
    }
  }

  async function addFriend(friendCode: string) {
    error.value = null
    try {
      const res = await api.post('/friends/add', { friend_code: friendCode })
      return res.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to send friend request'
      throw err
    }
  }

  async function acceptFriend(requestId: number) {
    try {
      await api.post(`/friends/${requestId}/accept`)
      await fetchFriends()
      await fetchPending()
    } catch (err) {
      console.error('Accept friend error:', err)
    }
  }

  async function removeFriend(friendshipId: number) {
    try {
      await api.delete(`/friends/${friendshipId}`)
      friends.value = friends.value.filter(f => f.friendship_id !== friendshipId)
    } catch (err) {
      console.error('Remove friend error:', err)
    }
  }

  return { friends, pending, loading, error, fetchFriends, fetchPending, addFriend, acceptFriend, removeFriend }
})
