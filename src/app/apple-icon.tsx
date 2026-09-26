import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Ikon layar utama iOS: bintang jatuh Sparks di atas teal.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#008560" }}>
        <svg viewBox="0 0 64 64" width="180" height="180">
          <g stroke="#FFCD00" strokeWidth="4.5" strokeLinecap="round">
            <path d="M10 44 L25 29" />
            <path d="M16 52 L31 37" opacity=".8" />
            <path d="M26 56 L37 45" opacity=".6" />
          </g>
          <path d="M43 7l4.3 9.1 10 1.2-7.4 6.9 2 9.9L43 29.2l-8.9 4.9 2-9.9-7.4-6.9 10-1.2L43 7z" fill="#FFCD00" />
        </svg>
      </div>
    ),
    size,
  );
}
