"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[global-error] beklenmedik hata:", error);
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1815",
          color: "#f4efe6",
          fontFamily: "Georgia, 'Times New Roman', serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "32rem", textAlign: "center" }}>
          <p
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              fontSize: "0.75rem",
              opacity: 0.7,
              margin: 0,
            }}
          >
            Sistem Hatası
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              margin: "1rem 0",
              lineHeight: 1.1,
            }}
          >
            Bir şeyler ters gitti
          </h1>
          <p
            style={{
              fontSize: "1rem",
              opacity: 0.8,
              marginBottom: "2rem",
            }}
          >
            Uygulama beklenmedik bir hatayla karşılaştı. Tekrar denemek için aşağıdaki butonu
            kullanın.
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                opacity: 0.5,
                marginBottom: "1.5rem",
              }}
            >
              İz: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: "2.75rem",
              minWidth: "2.75rem",
              padding: "0.75rem 1.5rem",
              border: "2px solid #c4a572",
              backgroundColor: "transparent",
              color: "#f4efe6",
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              fontSize: "0.75rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Tekrar Dene
          </button>
        </div>
      </body>
    </html>
  );
}
