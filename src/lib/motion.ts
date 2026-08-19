export const motionTokens = {
  duration: {
    fast: 150,
    normal: 220,
    slow: 350,
    success: 650,
  },
  easing: {
    standard: [0.22, 1, 0.36, 1] as const,
    emphasized: [0.34, 1.56, 0.64, 1] as const,
  },
} as const;

export const motionTransition = {
  fast: {
    duration: motionTokens.duration.fast / 1000,
    ease: motionTokens.easing.standard,
  },
  normal: {
    duration: motionTokens.duration.normal / 1000,
    ease: motionTokens.easing.standard,
  },
  slow: {
    duration: motionTokens.duration.slow / 1000,
    ease: motionTokens.easing.standard,
  },
  success: {
    duration: motionTokens.duration.success / 1000,
    ease: motionTokens.easing.standard,
  },
} as const;

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error' | 'disabled';
