import { createFileRoute, Link } from '@tanstack/react-router'
import { Home, MoveLeft, MoveRight } from 'lucide-react'
import React from 'react'

export const Route = createFileRoute('/$404')({
  path: '*',
  component: NotFoundRoute,
})

function NotFoundRoute() {
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = React.useState(false)

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovering) {
        setPosition({
          x: Math.sin(Date.now() / 1000) * 20,
          y: Math.cos(Date.now() / 1500) * 20,
        })
      }
    }, 50)

    return () => clearInterval(interval)
  }, [isHovering])

  return (
    <div className="min-h-screen bg-violet-400 bg-[linear-gradient(to_right,#80808042_1px,transparent_1px),linear-gradient(to_bottom,#80808042_1px,transparent_1px)] bg-[size:48px_48px]">
      <div className="container mx-auto px-4 h-screen flex flex-col items-center justify-center">
        <div
          className="relative bg-neutral-200 p-8 md:p-12 rounded-2xl shadow-2xl max-w-2xl w-full text-center transform transition-transform duration-500 hover:scale-105"
          style={{
            boxShadow: '8px 8px 0px #222',
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
            <div
              className="relative w-40 h-40 bg-neutral-200 rounded-full flex items-center justify-center transform transition-all duration-500"
              style={{
                boxShadow: '6px 6px 0px #222',
                transform: `translate(${position.x}px, ${position.y}px)`,
              }}
            >
              <div className="text-8xl font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                4
              </div>
              <div
                className="absolute w-24 h-24 bg-neutral-200 rounded-full -right-8 top-4 flex items-center justify-center"
                style={{ boxShadow: '4px 4px 0px #222' }}
              >
                <div className="text-6xl font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                  0
                </div>
              </div>
              <div
                className="absolute w-24 h-24 bg-neutral-200 rounded-full -left-8 bottom-4 flex items-center justify-center"
                style={{ boxShadow: '4px 4px 0px #222' }}
              >
                <div className="text-6xl font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                  4
                </div>
              </div>
            </div>
          </div>

          <div className="mt-24">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">
              Oops! Page Not Found
            </h1>
            <p className="text-neutral-600 mb-8">
              Looks like you've wandered into uncharted territory. Don't worry
              though, we can help you find your way back!
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors w-full sm:w-auto"
              >
                <Home size={20} />
                Back to Home
              </Link>
              <Link
                to="/editor"
                className="flex items-center gap-2 px-6 py-3 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 transition-colors w-full sm:w-auto"
              >
                <MoveLeft size={20} className="animate-bounce-x" />
                Go to Editor
                <MoveRight size={20} className="animate-bounce-x" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundRoute
