interface NeuralNetworkLoaderProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function NeuralNetworkLoader({
  message = 'Accessing your discovery feed...',
  size = 'sm'
}: NeuralNetworkLoaderProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex items-center space-x-3">
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="animate-pulse"
        >
          {/* Neural Network Connections */}
          <g className="opacity-60">
            {/* Horizontal connections */}
            <line x1="4" y1="6" x2="8" y2="12" stroke="currentColor" strokeWidth="1" className="text-indigo-400" />
            <line x1="4" y1="18" x2="8" y2="12" stroke="currentColor" strokeWidth="1" className="text-indigo-400" />
            <line x1="8" y1="12" x2="16" y2="8" stroke="currentColor" strokeWidth="1" className="text-cyan-400" />
            <line x1="8" y1="12" x2="16" y2="16" stroke="currentColor" strokeWidth="1" className="text-cyan-400" />
            <line x1="16" y1="8" x2="20" y2="12" stroke="currentColor" strokeWidth="1" className="text-indigo-400" />
            <line x1="16" y1="16" x2="20" y2="12" stroke="currentColor" strokeWidth="1" className="text-indigo-400" />

            {/* Cross connections */}
            <line x1="4" y1="6" x2="16" y2="16" stroke="currentColor" strokeWidth="0.5" className="text-gray-300" />
            <line x1="4" y1="18" x2="16" y2="8" stroke="currentColor" strokeWidth="0.5" className="text-gray-300" />
          </g>

          {/* Neural Nodes */}
          <g>
            {/* Input layer */}
            <circle cx="4" cy="6" r="2" fill="currentColor" className="text-indigo-600 animate-ping"
                    style={{ animationDelay: '0s', animationDuration: '1.5s' }} />
            <circle cx="4" cy="18" r="2" fill="currentColor" className="text-indigo-600 animate-ping"
                    style={{ animationDelay: '0.3s', animationDuration: '1.5s' }} />

            {/* Hidden layer */}
            <circle cx="8" cy="12" r="2.5" fill="currentColor" className="text-cyan-600 animate-ping"
                    style={{ animationDelay: '0.6s', animationDuration: '1.5s' }} />

            {/* Output layer */}
            <circle cx="16" cy="8" r="2" fill="currentColor" className="text-indigo-600 animate-ping"
                    style={{ animationDelay: '0.9s', animationDuration: '1.5s' }} />
            <circle cx="16" cy="16" r="2" fill="currentColor" className="text-indigo-600 animate-ping"
                    style={{ animationDelay: '1.2s', animationDuration: '1.5s' }} />

            {/* Final output */}
            <circle cx="20" cy="12" r="2.5" fill="currentColor" className="text-cyan-600 animate-ping"
                    style={{ animationDelay: '1.5s', animationDuration: '1.5s' }} />
          </g>

          {/* Data flow animation */}
          <g className="animate-pulse">
            <circle cx="4" cy="6" r="1" fill="currentColor" className="text-white" />
            <circle cx="4" cy="18" r="1" fill="currentColor" className="text-white" />
            <circle cx="8" cy="12" r="1.5" fill="currentColor" className="text-white" />
            <circle cx="16" cy="8" r="1" fill="currentColor" className="text-white" />
            <circle cx="16" cy="16" r="1" fill="currentColor" className="text-white" />
            <circle cx="20" cy="12" r="1.5" fill="currentColor" className="text-white" />
          </g>
        </svg>
      </div>
      {message && size !== 'sm' && (
        <span className="text-sm text-gray-600 animate-pulse">{message}</span>
      )}
    </div>
  )
}