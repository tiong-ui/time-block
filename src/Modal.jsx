import { useEffect, useRef } from 'react'

// A dialog over the screen, for a question that has to be answered
// before anything else makes sense.
//
// Built on <dialog showModal()> rather than a div with a high z-index.
// The browser then owns the hard parts: focus moves in and is kept
// there, Escape closes it, everything behind goes inert, and it is
// drawn in the top layer, so no stacking context can bury it.
export default function Modal({ onClose, labelledBy, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog?.isConnected || dialog.open) return undefined
    dialog.showModal()
    // showModal() makes the page behind inert, but iOS will still
    // scroll it under the dialog, which reads as the dialog sliding
    // around. Hold the page still while it is up.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
      if (dialog.open) dialog.close()
    }
  }, [])

  // Escape goes through `cancel`, a button through `close` — both end
  // up here, so the caller only has to know that it was dismissed.
  function handleCancel(event) {
    event.preventDefault()
    onClose()
  }

  // Clicking the backdrop lands on the dialog itself: the padding
  // belongs to the element, everything drawn is in a child.
  function handleClick(event) {
    if (event.target === ref.current) onClose()
  }

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={labelledBy}
      onCancel={handleCancel}
      onClick={handleClick}
    >
      <div className="modal-card">{children}</div>
    </dialog>
  )
}
