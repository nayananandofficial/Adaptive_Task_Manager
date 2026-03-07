import { useState, type FormEvent } from 'react'
import { useApp } from '../../contexts/AppContext'
import { Target, Sparkles } from 'lucide-react'

export function FocusPrompt() {
  const { dispatch } = useApp()
  const [focus, setFocus] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (focus.trim()) {
      dispatch({ type: 'SET_FOCUS_TODAY', payload: focus.trim() })
    }
  }

  const suggestions = [
    'Complete project proposal',
    'Review and respond to emails',
    'Finish chapter 3 draft',
    'Prepare for client meeting',
    'Study for upcoming exam'
  ]

  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4">
            <Target className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            What's your focus today?
          </h1>
          <p className="text-gray-600">
            Set your daily intention to stay motivated and on track
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <textarea
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="I want to focus on..."
              className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={!focus.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set Focus & Continue
          </button>
        </form>

        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Quick suggestions:
          </p>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setFocus(suggestion)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
