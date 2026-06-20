import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'StarlingPost — Post once to YouTube, X & LinkedIn';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0a0a0b',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d4ff3a' }} />
          <span style={{ color: '#52525b', fontSize: 13, letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
            StarlingPost · Beta
          </span>
        </div>

        {/* Main headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: '#ffffff', fontSize: 72, lineHeight: 0.9, letterSpacing: '-0.04em', fontStyle: 'italic' }}>
            One post.
          </div>
          <div style={{ color: '#52525b', fontSize: 72, lineHeight: 0.9, letterSpacing: '-0.04em', fontStyle: 'italic' }}>
            All platforms.
          </div>
          <div
            style={{
              color: '#ffffff',
              fontSize: 72,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              fontStyle: 'italic',
              background: 'rgba(212,255,58,0.25)',
              display: 'inline-flex',
              paddingLeft: 4,
              paddingRight: 4,
            }}
          >
            Zero tab-juggling.
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#3f3f46', fontSize: 16, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
            YouTube · Twitter/X · LinkedIn
          </span>
          <span style={{ color: '#d4ff3a', fontSize: 20, letterSpacing: '-0.02em', fontStyle: 'italic' }}>
            starlingpost.com
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
