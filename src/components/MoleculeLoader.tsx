interface MoleculeLoaderProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function MoleculeLoader({
  message = 'Generating secure reset protocol...',
  size = 'sm'
}: MoleculeLoaderProps) {
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
          className="animate-spin"
          style={{ animationDuration: '3s' }}
        >
          {/* Molecular bonds */}
          <g className="opacity-50">
            {/* Central bonds */}
            <line x1="12" y1="12" x2="6" y2="6" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400" />
            <line x1="12" y1="12" x2="18" y2="6" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400" />
            <line x1="12" y1="12" x2="6" y2="18" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400" />
            <line x1="12" y1="12" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400" />

            {/* Peripheral bonds */}
            <line x1="6" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="1" className="text-gray-300" />
            <line x1="6" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth="1" className="text-gray-300" />
            <line x1="6" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="1" className="text-gray-300" />
            <line x1="18" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1" className="text-gray-300" />

            {/* Diagonal bonds */}
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="0.5" className="text-gray-200" />
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="0.5" className="text-gray-200" />
          </g>

          {/* Atoms */}
          <g>
            {/* Central atom */}
            <circle cx="12" cy="12" r="3" fill="currentColor" className="text-indigo-600" />
            <circle cx="12" cy="12" r="2" fill="currentColor" className="text-white animate-pulse" />

            {/* Corner atoms */}
            <circle cx="6" cy="6" r="2.5" fill="currentColor" className="text-cyan-600 animate-bounce"
                    style={{ animationDelay: '0s', animationDuration: '2s' }} />
            <circle cx="18" cy="6" r="2.5" fill="currentColor" className="text-indigo-500 animate-bounce"
                    style={{ animationDelay: '0.5s', animationDuration: '2s' }} />
            <circle cx="6" cy="18" r="2.5" fill="currentColor" className="text-cyan-500 animate-bounce"
                    style={{ animationDelay: '1s', animationDuration: '2s' }} />
            <circle cx="18" cy="18" r="2.5" fill="currentColor" className="text-indigo-600 animate-bounce"
                    style={{ animationDelay: '1.5s', animationDuration: '2s' }} />

            {/* Inner circles for atoms */}
            <circle cx="6" cy="6" r="1.5" fill="currentColor" className="text-white" />
            <circle cx="18" cy="6" r="1.5" fill="currentColor" className="text-white" />
            <circle cx="6" cy="18" r="1.5" fill="currentColor" className="text-white" />
            <circle cx="18" cy="18" r="1.5" fill="currentColor" className="text-white" />
          </g>

          {/* Electron orbitals */}
          <g className="animate-ping opacity-30">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-indigo-300" />
            <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-cyan-300" />
          </g>
        </svg>
      </div>
      {message && size !== 'sm' && (
        <span className="text-sm text-gray-600 animate-pulse">{message}</span>
      )}
    </div>
  )
}