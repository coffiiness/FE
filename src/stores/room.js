import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import roomsData from '@/data/rooms.json'

export const useRoomStore = defineStore('room', () => {
    const rooms = ref(roomsData)

    const getRoomById = (id) => {
        return rooms.value.find(room => room.id === id)
    }

    return {
        rooms,
        getRoomById
    }
})
