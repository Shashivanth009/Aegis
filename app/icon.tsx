import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1C1917',
          borderRadius: '8px',
          color: '#B45309',
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'serif',
          border: '2px solid #B45309',
        }}
      >
        A
      </div>
    ),
    { ...size }
  )
}
