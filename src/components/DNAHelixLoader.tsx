interface DNAHelixLoaderProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function DNAHelixLoader({
  message = 'Creating your research profile...',
  size = 'sm'
}: DNAHelixLoaderProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex items-center space-x-3">
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          className="animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DNA Helix Structure */}
          <g className="origin-center">
            {/* Left strand */}
            <path
              d="M8 2 Q12 6 8 10 Q4 14 8 18 Q12 22 8 26"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-indigo-600"
            />
            {/* Right strand */}
            <path
              d="M16 2 Q12 6 16 10 Q20 14 16 18 Q12 22 16 26"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-cyan-600"
            />
            {/* Base pairs */}
            <g className="animate-pulse">
              <line x1="8" y1="4" x2="16" y2="4" stroke="currentColor" strokeWidth="1" className="text-gray-400" />
              <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1" className="text-gray-400" />
              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1" className="text-gray-400" />
              <line x1="8" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="1" className="text-gray-400" />
              <line x1="8" y1="20" x2="16" y2="20" stroke="currentColor" strokeWidth="1" className="text-gray-400" />
            </g>
            {/* Nucleotide dots */}
            <g className="animate-bounce">
              <circle cx="8" cy="4" r="1.5" fill="currentColor" className="text-indigo-500" />
              <circle cx="16" cy="4" r="1.5" fill="currentColor" className="text-cyan-500" />
              <circle cx="8" cy="12" r="1.5" fill="currentColor" className="text-indigo-500" />
              <circle cx="16" cy="12" r="1.5" fill="currentColor" className="text-cyan-500" />
              <circle cx="8" cy="20" r="1.5" fill="currentColor" className="text-indigo-500" />
              <circle cx="16" cy="20" r="1.5" fill="currentColor" className="text-cyan-500" />
            </g>
          </g>
        </svg>
      </div>
      {message && size !== 'sm' && (
        <span className="text-sm text-gray-600 animate-pulse">{message}</span>
      )}
    </div>
  )
}