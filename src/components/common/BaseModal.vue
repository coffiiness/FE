<template>
  <teleport to="body">

    <div
        v-if="show"
        class="modal-backdrop"
        @click.self="close"
    >

      <div class="modal">

        <h2 v-if="title" class="modal-title">
          {{ title }}
        </h2>

        <div class="modal-body">
          <slot />
        </div>

        <div class="modal-actions">

          <button
              v-if="showCancel"
              class="btn ghost"
              @click="close"
          >
            취소
          </button>

          <button
              class="btn"
              @click="confirm"
          >
            {{ confirmText }}
          </button>

        </div>

      </div>

    </div>

  </teleport>
</template>

<script setup>

defineProps({

  show: Boolean,

  title: String,

  confirmText: {
    type: String,
    default: '확인'
  },

  showCancel: {
    type: Boolean,
    default: true
  }

})

const emit = defineEmits(['close', 'confirm'])

const close = () => {
  emit('close')
}

const confirm = () => {
  emit('confirm')
}
</script>

<style scoped>

.modal-backdrop {
  position: fixed;
  inset: 0;

  background: rgba(2, 6, 23, 0.55);

  display: flex;
  justify-content: center;
  align-items: center;

  z-index: 9999;
}

.modal {
  background: white;

  width: 560px;
  max-width: 90vw;

  min-height: 420px;
  max-height: 80vh;

  padding: 36px 40px;

  border-radius: 22px;

  box-shadow: 0 25px 70px rgba(0,0,0,0.25);

  animation: modalFade .25s ease-out;

  display: flex;
  flex-direction: column;

  overflow: hidden;
}

.modal-title {
  font-size: 22px;
  font-weight: 800;

  margin-bottom: 18px;

  color: #020617;
}

.modal-body {
  flex: 1;

  overflow-y: auto;

  font-size: 15px;

  color: #334155;

  line-height: 1.7;
}

.modal-actions {
  margin-top: 32px;

  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  background: #0d9488;
  color: white;

  padding: 12px 22px;

  border-radius: 12px;
  border: none;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;

  transition: all .2s ease;
}

.btn:hover {
  background: #14b8a6;
}

.btn.ghost {
  background: #e2e8f0;
  color: #020617;
}

.btn.ghost:hover {
  background: #cbd5e1;
}

@keyframes modalFade {

  from {
    opacity: 0;
    transform: translateY(20px) scale(.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

}
</style>
