import { NextResponse } from "next/server";

// Route handler'lar arası tek tip "Problem" response. Client tarafı
// `lib/api-fetch.ts:postJson` `payload.title` üzerinden Türkçe mesajı toast'a
// gösteriyor; tüm endpoint'lerin aynı şekli üretmesi şart.
export function problem(title: string, status: number): NextResponse {
  return NextResponse.json({ title, status }, { status });
}
