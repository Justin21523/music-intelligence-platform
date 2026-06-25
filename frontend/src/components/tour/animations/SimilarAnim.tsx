export function SimilarAnim() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <style>{`
        @keyframes orbitIn {
          0%   { opacity: 0; transform: translate(var(--ox), var(--oy)) scale(0.4); }
          40%  { opacity: 1; }
          80%  { transform: translate(calc(var(--ox) * 0.1), calc(var(--oy) * 0.1)) scale(1); }
          100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
        }
        @keyframes centerPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,53,0.5); }
          50%       { box-shadow: 0 0 0 16px rgba(255,107,53,0); }
        }
        @keyframes linkFade {
          0%, 60% { opacity: 0; }
          100%    { opacity: 0.35; }
        }
      `}</style>

      <svg width="220" height="180" style={{ position: 'absolute' }}>
        {[
          { cx: 110, cy: 90, tx: 35,  ty: 30  },
          { cx: 110, cy: 90, tx: 185, ty: 28  },
          { cx: 110, cy: 90, tx: 20,  ty: 100 },
          { cx: 110, cy: 90, tx: 200, ty: 105 },
          { cx: 110, cy: 90, tx: 60,  ty: 165 },
          { cx: 110, cy: 90, tx: 160, ty: 162 },
        ].map(({ cx, cy, tx, ty }, i) => (
          <line
            key={i}
            x1={cx} y1={cy} x2={tx} y2={ty}
            stroke="#ff6b35"
            strokeWidth={1}
            style={{ animation: `linkFade 1.8s ${i * 0.12}s ease-out both` }}
          />
        ))}
      </svg>

      {[
        { ox: '-75px', oy: '-60px', delay: '0s',    size: 22, color: '#22d3ee' },
        { ox:  '75px', oy: '-62px', delay: '0.1s',  size: 18, color: '#a78bfa' },
        { ox: '-90px', oy:  '10px', delay: '0.2s',  size: 20, color: '#34d399' },
        { ox:  '90px', oy:  '15px', delay: '0.3s',  size: 16, color: '#f59e0b' },
        { ox: '-50px', oy:  '75px', delay: '0.4s',  size: 14, color: '#f87171' },
        { ox:  '50px', oy:  '72px', delay: '0.5s',  size: 17, color: '#60a5fa' },
      ].map(({ ox, oy, delay, size, color }, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            background: color,
            opacity: 0,
            // @ts-expect-error CSS custom property
            '--ox': ox,
            '--oy': oy,
            animation: `orbitIn 1.6s ${delay} ease-out both`,
          }}
        />
      ))}

      {/* Central node */}
      <div
        style={{
          position: 'relative',
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#ff6b35',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'centerPulse 2s 0.8s ease-in-out infinite',
          zIndex: 2,
        }}
      >
        <span style={{ fontSize: 18 }}>🎵</span>
      </div>
    </div>
  )
}
