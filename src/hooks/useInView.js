import { useEffect, useRef, useState } from 'react'

const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// Staggered scroll reveal. Flips true `delay`ms after the element first
// intersects, then stops observing — the reveal is one-way, so a row that
// scrolls back out stays put instead of re-animating.
//
// Readers who asked for reduced motion (and anything without an
// IntersectionObserver) skip straight to the revealed state rather than
// being left staring at an opacity-0 list.
export default function useInView({ delay = 0, threshold = 0.12, rootMargin = '0px 0px -6% 0px' } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    let timer
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          timer = setTimeout(() => setInView(true), delay)
          io.unobserve(el)
        }
      },
      { threshold, rootMargin },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      clearTimeout(timer)
    }
  }, [delay, threshold, rootMargin])

  return [ref, inView]
}
