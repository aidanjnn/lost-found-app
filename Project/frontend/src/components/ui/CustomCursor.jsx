import { useEffect, useRef, useState } from "react"

export function CustomCursor({
  cursorType = "circle-and-dot",
  color = "#C7A842",
  size = 20,
  glitchColorB = "#E8D066",
  glitchColorR = "#705318",
}) {
  const cursorRef = useRef(null)
  const circleRef = useRef(null)
  const dotRef = useRef(null)
  const filterRef = useRef(null)

  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const [isVisible, setIsVisible] = useState(true)
  const [isHovering, setIsHovering] = useState(false)
  const [fading, setFading] = useState(false)

  const positionState = useRef({
    distanceX: 0,
    distanceY: 0,
    distance: 0,
    pointerX: 0,
    pointerY: 0,
    previousPointerX: 0,
    previousPointerY: 0,
    angle: 0,
    previousAngle: 0,
    angleDisplace: 0,
    degrees: 57.296,
    moving: false,
  })

  useEffect(() => {
    document.body.style.cursor = "none"

    const handleMouseMove = (event) => {
      const state = positionState.current
      state.previousPointerX = state.pointerX
      state.previousPointerY = state.pointerY
      state.pointerX = event.pageX
      state.pointerY = event.pageY
      state.distanceX = state.previousPointerX - state.pointerX
      state.distanceY = state.previousPointerY - state.pointerY
      state.distance = Math.sqrt(state.distanceY ** 2 + state.distanceX ** 2)

      setPosition({ x: event.clientX, y: event.clientY })

      const target = event.target
      const isInteractive =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.onclick !== null ||
        target.classList.contains("cursor-hover") ||
        target.getAttribute('role') === 'button' ||
        target.closest('button') !== null ||
        target.closest('a') !== null
      setIsHovering(isInteractive)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const handleClick = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform += " scale(0.75)"
        setTimeout(() => {
          if (cursorRef.current) {
            cursorRef.current.style.transform = cursorRef.current.style.transform.replace(" scale(0.75)", "")
          }
        }, 35)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("click", handleClick)

    return () => {
      document.body.style.cursor = "auto"
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("click", handleClick)
    }
  }, [isVisible])

  const calculateRotation = () => {
    const state = positionState.current
    if (state.distance <= 1) return state.angleDisplace

    const unsortedAngle = Math.atan(Math.abs(state.distanceY) / Math.abs(state.distanceX)) * state.degrees
    state.previousAngle = state.angle

    if (state.distanceX <= 0 && state.distanceY >= 0) {
      state.angle = 90 - unsortedAngle + 0
    } else if (state.distanceX < 0 && state.distanceY < 0) {
      state.angle = unsortedAngle + 90
    } else if (state.distanceX >= 0 && state.distanceY <= 0) {
      state.angle = 90 - unsortedAngle + 180
    } else if (state.distanceX > 0 && state.distanceY > 0) {
      state.angle = unsortedAngle + 270
    }

    if (isNaN(state.angle)) {
      state.angle = state.previousAngle
    } else {
      if (state.angle - state.previousAngle <= -270) {
        state.angleDisplace += 360 + state.angle - state.previousAngle
      } else if (state.angle - state.previousAngle >= 270) {
        state.angleDisplace += state.angle - state.previousAngle - 360
      } else {
        state.angleDisplace += state.angle - state.previousAngle
      }
    }
    return state.angleDisplace
  }

  useEffect(() => {
    const state = positionState.current
    if (state.distance > 1 && !fading) {
      setFading(true)
      setTimeout(() => {
        setFading(false)
      }, 50)
    }
  }, [positionState.current.distance, fading])

  const getBaseStyle = () => ({
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 2147483647,
    pointerEvents: "none",
    userSelect: "none",
    opacity: isVisible ? 1 : 0,
    transition: "opacity 250ms ease, transform 100ms ease",
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    willChange: "transform",
  })

  const renderCircleAndDot = () => {
    const rotation = calculateRotation()

    return (
      <div
        ref={cursorRef}
        style={{
          ...getBaseStyle(),
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: "transparent",
          border: isHovering ? `10px solid ${color}` : `1.25px solid ${color}`,
          borderRadius: "50%",
          boxShadow: `0 ${-15 - positionState.current.distance}px 0 -8px ${color}${fading ? "00" : ""}`,
          transform: `translate3d(${position.x - size / 2}px, ${position.y - size / 2}px, 0) rotate(${rotation}deg)`,
        }}
      />
    )
  }

  const renderGlitchEffect = () => {
    const state = positionState.current
    const distanceX = Math.min(Math.max(state.distanceX, -10), 10)
    const distanceY = Math.min(Math.max(state.distanceY, -10), 10)
    const currentSize = isHovering ? 30 : 15

    return (
      <div
        ref={cursorRef}
        style={{
          ...getBaseStyle(),
          width: `${currentSize}px`,
          height: `${currentSize}px`,
          backgroundColor: "#222",
          borderRadius: "50%",
          backdropFilter: "invert(1)",
          boxShadow: `${distanceX}px ${distanceY}px 0 ${glitchColorB}, ${-distanceX}px ${-distanceY}px 0 ${glitchColorR}`,
          transform: `translate3d(${position.x - currentSize / 2}px, ${position.y - currentSize / 2}px, 0)`,
        }}
      />
    )
  }

  const renderMotionBlur = () => {
    const state = positionState.current
    const distanceX = Math.min(Math.max(state.distanceX, -20), 20)
    const distanceY = Math.min(Math.max(state.distanceY, -20), 20)

    const unsortedAngle = Math.atan(Math.abs(distanceY) / Math.abs(distanceX)) * state.degrees
    let angle = 0
    let stdDeviation = "0, 0"

    if (!isNaN(unsortedAngle)) {
      if (unsortedAngle <= 45) {
        angle = distanceX * distanceY >= 0 ? unsortedAngle : -unsortedAngle
        stdDeviation = `${Math.abs(distanceX / 2)}, 0`
      } else {
        angle = distanceX * distanceY <= 0 ? 180 - unsortedAngle : unsortedAngle
        stdDeviation = `${Math.abs(distanceY / 2)}, 0`
      }
    }

    return (
      <svg
        ref={cursorRef}
        style={{
          ...getBaseStyle(),
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          overflow: "visible",
          transform: `translate3d(${position.x - size / 2}px, ${position.y - size / 2}px, 0) rotate(${angle}deg)`,
        }}
      >
        <defs>
          <filter id="motionblur" x="-100%" y="-100%" width="400%" height="400%">
            <feGaussianBlur ref={filterRef} stdDeviation={stdDeviation} />
          </filter>
        </defs>
        <circle cx="50%" cy="50%" r="5" fill={color} filter="url(#motionblur)" />
      </svg>
    )
  }

  const renderCursor = () => {
    switch (cursorType) {
      case "glitch-effect":
        return renderGlitchEffect()
      case "motion-blur":
        return renderMotionBlur()
      case "circle-and-dot":
      default:
        return renderCircleAndDot()
    }
  }

  return <>{renderCursor()}</>
}

