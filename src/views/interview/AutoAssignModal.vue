<script setup>
import { ref, computed } from 'vue'

defineProps({
  open: Boolean
})

const emit = defineEmits(['close', 'submit'])

const useTimeRange = ref(true)
const useMaxHour = ref(true)

const hourOptions = computed(() => {
  const list = []
  for (let i = 9; i <= 18; i++) {
    const period = i < 12 ? 'AM' : 'PM'
    const hour12 = i % 12 === 0 ? 12 : i % 12
    list.push({
      label: `${hour12} ${period}`,
      value: i
    })
  }
  return list
})

const startHour = ref(9)
const endHour = ref(11)

/* 기본값 1시간, 최대 6 */
const maxHour = ref(1)

const submit = () => {

  const options = {
    useTimeRange: useTimeRange.value,
    start: startHour.value,
    end: endHour.value,

    useMaxHour: useMaxHour.value,

    hours: maxHour.value
  }

  emit('submit', options)
  emit('close')
}

</script>

<template>
  <div v-if="open" class="overlay">

    <div class="modal">

      <h2 class="title">자동 일정 배정</h2>

      <!-- 시간 범위 -->
      <div class="row">

        <label class="checkLabel">
          <input type="checkbox" v-model="useTimeRange" />
          시작 시간
        </label>

        <select
            v-model="startHour"
            :disabled="!useTimeRange"
            class="cleanSelect"
        >
          <option v-for="h in hourOptions" :key="h.value" :value="h.value">
            {{ h.label }}
          </option>
        </select>

      </div>

      <div class="row">

        <label class="checkLabel">
          <input type="checkbox" v-model="useTimeRange" />
          종료 시간
        </label>

        <select
            v-model="maxHour"
            :disabled="!useMaxHour"
            class="cleanSelect"
        >
          <option v-for="h in hourOptions" :key="h.value" :value="h.value">
            {{ h.label }}
          </option>
        </select>

      </div>


      <div class="row">

        <label class="checkLabel">
          <input type="checkbox" v-model="useMaxHour" />
          예약 시간(시간)
        </label>

        <select
            v-model="maxHour"
            :disabled="!useMaxHour"
            :class="{ disabled: !useMaxHour }"
            class="cleanSelect"
        >
          <option v-for="h in 6" :key="h" :value="h">
            {{ h }}시간
          </option>
        </select>

      </div>

      <!-- 버튼 -->
      <div class="btnRow">

        <button class="cancel" @click="emit('close')">
          취소
        </button>

        <button class="confirm" @click="submit">
          자동 배정
        </button>

      </div>

    </div>

  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  z-index: 9999;
}

.modal {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);

  width: 460px;
  background: #ffffff;
  padding: 28px 32px;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.2);
}

.title {
  text-align: center;
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 22px;
  color: #0f172a;
}


.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.row label {
  font-weight: 700;
  color: #334155;
}


.row input {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.row input {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #0f172a;
  background: #f8fafc;
}

.btnRow {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 26px;
}

/* 취소 버튼 */
.cancel {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.cancel:hover {
  background: #e2e8f0;
}

/* 자동배정 버튼 */
.confirm {
  background: #0D9488;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.confirm:hover {
  background: #0f766e;
}

.confirm {
  background: #0D9488;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 700;
}

/* 체크 라벨 */
.checkLabel {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
}

.cleanSelect {
  width: 140px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  font-weight: 600;
  background: #ffffff;
  color: #0f172a;
}

/* 비활성 상태 */
.cleanSelect:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  border-color: #e2e8f0;
  cursor: not-allowed;
}

</style>
