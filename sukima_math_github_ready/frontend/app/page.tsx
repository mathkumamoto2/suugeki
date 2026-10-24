"use client";

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    window.location.href = "/login";
  }, []);

  return (
    <div className="card">
      <h1>ログインページへ移動しています...</h1>
    </div>
  );
}
