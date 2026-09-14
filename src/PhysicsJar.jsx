import { useEffect, useRef } from 'react'
import Matter from 'matter-js'
import { JAR_CAPACITY } from './stars.js'
import { tBoth } from './i18n.js'

// A jar where the stars are real physics bodies: they fall in from the
// neck, tumble, collide, and pile up at the bottom under gravity — and
// they jostle around when the jar is shaken.
//
// The whole jar (glass + stars) is drawn on a canvas so the physics
// coordinates and the artwork share one space.

const STAR_RADIUS = 7
const SPAWN_INTERVAL_MS = 110
const SHAKE_PULSE_MS = 70

export default function PhysicsJar({ count, size = 170, shakeSignal = 0, onShake }) {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const starsRef = useRef([])
  const spawnQueueRef = useRef({ remaining: 0, nextAt: 0 })
  const prevCountRef = useRef(0)
  const seededRef = useRef(false)
  const shakeUntilRef = useRef(0)
  const nextPulseRef = useRef(0)
  const colorsRef = useRef({ accent: '#7c83fd', glass: '#ffffff', soft: '#edefff' })

  // Geometry shared by the physics walls and the drawing below.
  const lidH = 10
  const neckH = 10
  const bodyH = size * 0.95
  const height = lidH + neckH + bodyH
  const bodyTop = lidH + neckH
  const pad = 10

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const root = document.documentElement
    const styles = getComputedStyle(root)
    colorsRef.current = {
      accent: styles.getPropertyValue('--accent').trim() || '#7c83fd',
      glass: styles.getPropertyValue('--card-bg').trim() || '#ffffff',
      soft: styles.getPropertyValue('--accent-soft').trim() || '#edefff',
    }

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = height * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const engine = Matter.Engine.create()
    // Stronger than Matter's default — at this small pixel scale the
    // default feels floaty rather than like something dropping into a jar.
    engine.gravity.y = 2.2
    engineRef.current = engine

    // Jar interior: flat floor and straight side walls. The rounded
    // corners of the drawing are cosmetic.
    const floorY = bodyTop + bodyH - pad
    const leftX = pad
    const rightX = size - pad
    const wallThickness = 20

    Matter.Composite.add(engine.world, [
      Matter.Bodies.rectangle(size / 2, floorY + wallThickness / 2, size, wallThickness, { isStatic: true }),
      Matter.Bodies.rectangle(leftX - wallThickness / 2, height / 2, wallThickness, height * 2, { isStatic: true }),
      Matter.Bodies.rectangle(rightX + wallThickness / 2, height / 2, wallThickness, height * 2, { isStatic: true }),
    ])

    let rafId = null
    let lastTime = performance.now()

    function drawJar() {
      const { accent, glass, soft } = colorsRef.current
      ctx.clearRect(0, 0, size, height)

      // Glass body
      ctx.beginPath()
      roundedRect(ctx, 2, bodyTop, size - 4, bodyH - 2, [18, 18, 32, 32])
      ctx.fillStyle = glass
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = accent
      ctx.stroke()

      // Neck
      const neckW = size * 0.34
      ctx.beginPath()
      ctx.rect(size / 2 - neckW / 2, lidH, neckW, neckH)
      ctx.fillStyle = soft
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = accent
      ctx.stroke()

      // Lid
      const lidW = size * 0.46
      ctx.beginPath()
      roundedRect(ctx, size / 2 - lidW / 2, 0, lidW, lidH, [5, 5, 5, 5])
      ctx.fillStyle = accent
      ctx.fill()
    }

    function drawStars() {
      ctx.font = `${STAR_RADIUS * 2.3}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const body of starsRef.current) {
        ctx.save()
        ctx.translate(body.position.x, body.position.y)
        ctx.rotate(body.angle)
        ctx.fillText('⭐', 0, 0)
        ctx.restore()
      }
    }

    function frame(now) {
      const delta = Math.min(now - lastTime, 32)
      lastTime = now

      // Release queued stars into the jar one at a time.
      const queue = spawnQueueRef.current
      if (queue.remaining > 0 && now >= queue.nextAt) {
        const jitter = (Math.random() - 0.5) * size * 0.12
        const star = Matter.Bodies.circle(size / 2 + jitter, lidH + neckH / 2, STAR_RADIUS, {
          restitution: 0.35,
          friction: 0.6,
          frictionAir: 0.01,
          angle: Math.random() * Math.PI * 2,
        })
        Matter.Composite.add(engine.world, star)
        starsRef.current.push(star)
        queue.remaining -= 1
        queue.nextAt = now + SPAWN_INTERVAL_MS
      }

      // While shaking, jostle every star with small random impulses.
      if (now < shakeUntilRef.current && now >= nextPulseRef.current) {
        for (const body of starsRef.current) {
          Matter.Body.applyForce(body, body.position, {
            x: (Math.random() - 0.5) * 0.0016,
            y: -Math.random() * 0.0012,
          })
        }
        nextPulseRef.current = now + SHAKE_PULSE_MS
      }

      Matter.Engine.update(engine, delta)
      drawJar()
      drawStars()
      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      Matter.Composite.clear(engine.world, false)
      Matter.Engine.clear(engine)
      engineRef.current = null
      starsRef.current = []
      spawnQueueRef.current = { remaining: 0, nextAt: 0 }
      prevCountRef.current = 0
      seededRef.current = false
    }
  }, [size, height, bodyH, bodyTop, lidH, neckH, pad])

  // Add or reset stars whenever the target count changes.
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    const clamped = Math.max(0, Math.min(JAR_CAPACITY, count))
    const prev = prevCountRef.current

    if (!seededRef.current) {
      // First paint: stars already in the jar start piled at the
      // bottom rather than raining in from the top.
      seededRef.current = true
      const floorY = bodyTop + bodyH - pad
      for (let i = 0; i < clamped; i++) {
        const x = pad + STAR_RADIUS + Math.random() * (size - 2 * pad - 2 * STAR_RADIUS)
        const y = floorY - STAR_RADIUS - Math.random() * (bodyH * 0.55)
        const star = Matter.Bodies.circle(x, y, STAR_RADIUS, {
          restitution: 0.2,
          friction: 0.6,
          frictionAir: 0.01,
          angle: Math.random() * Math.PI * 2,
        })
        Matter.Composite.add(engine.world, star)
        starsRef.current.push(star)
      }
    } else if (clamped < prev) {
      // A fresh jar — clear what's there and drop the new ones in.
      for (const body of starsRef.current) {
        Matter.Composite.remove(engine.world, body)
      }
      starsRef.current = []
      spawnQueueRef.current = { remaining: clamped, nextAt: 0 }
    } else if (clamped > prev) {
      spawnQueueRef.current = {
        remaining: spawnQueueRef.current.remaining + (clamped - prev),
        nextAt: spawnQueueRef.current.nextAt,
      }
    }

    prevCountRef.current = clamped
  }, [count, bodyTop, bodyH, pad, size])

  // Shake whenever the signal changes (skipping the initial mount).
  const firstShakeRef = useRef(true)
  useEffect(() => {
    if (firstShakeRef.current) {
      firstShakeRef.current = false
      return undefined
    }
    const now = performance.now()
    shakeUntilRef.current = now + 1100
    nextPulseRef.current = now

    const el = canvasRef.current
    if (el) {
      el.classList.remove('jar-shaking')
      // Reflow so the animation restarts even on a repeat shake.
      void el.offsetWidth
      el.classList.add('jar-shaking')
      const timer = setTimeout(() => el.classList.remove('jar-shaking'), 1100)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [shakeSignal])

  return (
    <div className="physics-jar" style={{ width: size, height }}>
      <canvas
        ref={canvasRef}
        className={onShake ? 'jar-canvas tappable' : 'jar-canvas'}
        onClick={onShake}
        role="img"
        aria-label={tBoth('jarHolding', { count, capacity: JAR_CAPACITY })}
      />
    </div>
  )
}

function roundedRect(ctx, x, y, w, h, [tl, tr, br, bl]) {
  ctx.moveTo(x + tl, y)
  ctx.lineTo(x + w - tr, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr)
  ctx.lineTo(x + w, y + h - br)
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h)
  ctx.lineTo(x + bl, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl)
  ctx.lineTo(x, y + tl)
  ctx.quadraticCurveTo(x, y, x + tl, y)
  ctx.closePath()
}
