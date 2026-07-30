import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 6,
          color: "#14a35a",
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: -0.5,
        }}
      >
        BS
      </div>
    ),
    { ...size }
  );
}
