import { useEffect, useState } from 'react'

function DateTimeDisplay(): React.JSX.Element {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [])

  const dateText = now.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  const timeText = now.toLocaleTimeString()

  return (
    <div className="datetime-box" aria-live="polite">
      <p>{dateText}</p>
      <p>{timeText}</p>
    </div>
  )
}

export default DateTimeDisplay
