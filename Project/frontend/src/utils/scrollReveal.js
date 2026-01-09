/**
 * Scroll Reveal Utility
 * Sprint 4: Issue #46 - Reactive Scroll Animations
 * 
 * Adds scroll-triggered animations to elements
 */

export const initScrollReveal = () => {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed')
        // Optional: Unobserve after revealing (one-time animation)
        // observer.unobserve(entry.target)
      }
    })
  }, observerOptions)

  // Observe all elements with scroll-reveal classes
  const revealElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale')
  
  revealElements.forEach(el => {
    observer.observe(el)
  })

  return observer
}

// Clean up observer
export const cleanupScrollReveal = (observer) => {
  if (observer) {
    observer.disconnect()
  }
}


