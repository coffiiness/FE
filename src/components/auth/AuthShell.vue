<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  eyebrow: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  maxWidth: {
    type: String,
    default: '42rem'
  }
})

const slots = useSlots()

const hasCopy = computed(() => Boolean(slots.copy || props.eyebrow || props.title || props.description))
const hasFooter = computed(() => Boolean(slots.footer))
</script>

<template>
  <div class="auth-shell">
    <div class="auth-shell__background" aria-hidden="true">
      <div class="auth-shell__beam auth-shell__beam--blue"></div>
      <div class="auth-shell__beam auth-shell__beam--amber"></div>
      <div class="auth-shell__beam auth-shell__beam--rose"></div>
      <div class="auth-shell__beam auth-shell__beam--teal"></div>
      <div class="auth-shell__glow"></div>
    </div>

    <header class="auth-shell__header">
      <div class="auth-shell__brand">
        <svg class="auth-shell__brand-mark" viewBox="0 0 128 128" aria-hidden="true">
          <path
            d="M108 20H62C35 20 16 39 16 66c0 19 9 34 23 42V92c-9-6-15-16-15-31 0-22 15-33 40-33h35z"
            fill="url(#auth-shell-mark-gradient)"
          />
          <path
            d="M54 44h46l-10 14H63v18h27l-10 14H63v26l-15-2V58H37z"
            fill="url(#auth-shell-mark-gradient)"
          />
          <defs>
            <linearGradient id="auth-shell-mark-gradient" x1="18" y1="18" x2="112" y2="116" gradientUnits="userSpaceOnUse">
              <stop stop-color="#2dd4bf" />
              <stop offset="1" stop-color="#0f766e" />
            </linearGradient>
          </defs>
        </svg>
        <div class="auth-shell__brand-wordmark">
          <span class="auth-shell__brand-cal">Cal</span><span class="auth-shell__brand-fit">Fit</span>
        </div>
      </div>
    </header>

    <main class="auth-shell__content">
      <section class="auth-card" :style="{ maxWidth }">
        <div v-if="hasCopy" class="auth-card__copy">
          <slot name="copy">
            <span v-if="eyebrow" class="auth-card__eyebrow">{{ eyebrow }}</span>
            <h1 v-if="title" class="auth-card__title">{{ title }}</h1>
            <p v-if="description" class="auth-card__description">{{ description }}</p>
          </slot>
        </div>

        <div class="auth-card__body">
          <slot />
        </div>

        <div v-if="hasFooter" class="auth-card__footer">
          <slot name="footer" />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(247, 248, 252, 0.94) 100%);
}

.auth-shell__background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.auth-shell__beam {
  position: absolute;
  filter: blur(10px);
  opacity: 0.88;
  transform: rotate(-18deg);
  border-radius: 999px;
  animation: auth-shell-beam-float 16s ease-in-out infinite alternate;
}

.auth-shell__beam--blue {
  top: -9rem;
  right: 32%;
  width: 28rem;
  height: 90rem;
  background: linear-gradient(180deg, rgba(204, 251, 241, 0.96), rgba(94, 234, 212, 0.22));
  animation-duration: 18s;
}

.auth-shell__beam--amber {
  top: -14rem;
  right: 14%;
  width: 20rem;
  height: 96rem;
  background: linear-gradient(180deg, rgba(153, 246, 228, 0.96), rgba(20, 184, 166, 0.2));
  animation-duration: 14s;
  animation-delay: -4s;
}

.auth-shell__beam--rose {
  top: -12rem;
  right: -1rem;
  width: 24rem;
  height: 108rem;
  background: linear-gradient(180deg, rgba(45, 212, 191, 0.92), rgba(19, 78, 74, 0.14));
  animation-duration: 20s;
  animation-delay: -8s;
}

.auth-shell__beam--teal {
  bottom: -22rem;
  left: -12rem;
  width: 36rem;
  height: 36rem;
  transform: none;
  opacity: 0.5;
  filter: blur(80px);
  background: radial-gradient(circle, rgba(16, 185, 129, 0.32), rgba(16, 185, 129, 0));
  animation: auth-shell-orb-drift 22s ease-in-out infinite alternate;
}

.auth-shell__glow {
  position: absolute;
  inset: 7rem auto auto 8%;
  width: min(38rem, 44vw);
  height: min(38rem, 44vw);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.48) 32%, rgba(255, 255, 255, 0) 72%);
  filter: blur(12px);
  animation: auth-shell-glow-drift 18s ease-in-out infinite alternate;
}

.auth-shell__header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  min-height: 5.5rem;
  padding: 0 1.5rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.72);
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(18px);
}

.auth-shell__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
}

.auth-shell__brand-mark {
  width: 2.35rem;
  height: 2.35rem;
  flex-shrink: 0;
}

.auth-shell__brand-wordmark {
  font-size: 1.62rem;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.05em;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35);
}

.auth-shell__brand-cal {
  color: #2dd4bf;
}

.auth-shell__brand-fit {
  color: #f8fafc;
  text-shadow:
    1px 0 0 rgba(15, 23, 42, 0.44),
    -1px 0 0 rgba(15, 23, 42, 0.44),
    0 1px 0 rgba(15, 23, 42, 0.44),
    0 -1px 0 rgba(15, 23, 42, 0.44),
    0 2px 10px rgba(15, 23, 42, 0.18);
}

.auth-shell__content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 5.5rem 1.5rem 3rem;
}

.auth-card {
  width: min(100%, 100%);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 1.75rem;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(22px);
}

.auth-card__copy {
  padding: 3.1rem 3.1rem 1.4rem;
}

.auth-card__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: #ecfdf5;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.auth-card__title {
  margin-top: 1.15rem;
  font-size: clamp(2.1rem, 3.4vw, 3rem);
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -0.05em;
  color: #1f2a44;
}

.auth-card__description {
  margin-top: 0.85rem;
  max-width: 29rem;
  font-size: 1rem;
  line-height: 1.7;
  color: #667085;
}

.auth-card__body {
  padding: 0 3.1rem 2rem;
}

.auth-card__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 1.45rem 1.75rem 1.65rem;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  border-bottom-left-radius: 1.75rem;
  border-bottom-right-radius: 1.75rem;
  background: rgba(248, 250, 255, 0.86);
  color: #667085;
  font-size: 0.98rem;
}

@keyframes auth-shell-beam-float {
  0% {
    transform: translate3d(0, 0, 0) rotate(-18deg) scale(1);
  }

  100% {
    transform: translate3d(2.25rem, -2rem, 0) rotate(-14deg) scale(1.035);
  }
}

@keyframes auth-shell-orb-drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  100% {
    transform: translate3d(4rem, -2.5rem, 0) scale(1.08);
  }
}

@keyframes auth-shell-glow-drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  100% {
    transform: translate3d(3rem, 1.5rem, 0) scale(1.06);
  }
}

@media (max-width: 767px) {
  .auth-shell__header {
    min-height: 4.75rem;
    padding: 0 1rem;
  }

  .auth-shell__brand {
    gap: 0.3rem;
  }

  .auth-shell__brand-mark {
    width: 2rem;
    height: 2rem;
  }

  .auth-shell__brand-wordmark {
    font-size: 1.42rem;
  }

  .auth-shell__content {
    padding: 2.5rem 1rem 1.5rem;
  }

  .auth-card {
    border-radius: 1.3rem;
  }

  .auth-card__copy {
    padding: 2rem 1.4rem 1.1rem;
  }

  .auth-card__description {
    font-size: 0.94rem;
  }

  .auth-card__body {
    padding: 0 1.4rem 1.4rem;
  }

  .auth-card__footer {
    flex-direction: column;
    gap: 0.15rem;
    padding: 1.2rem 1rem 1.35rem;
  }
}
</style>
