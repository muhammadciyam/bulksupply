import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#16325c",
          color: "#14a35a",
          fontSize: 84,
          fontWeight: 800,
          letterSpacing: -2,
        }}
      >
        BS
      </div>
    ),
    { ...size }
  );
}
