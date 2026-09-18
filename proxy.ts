import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// A partir do Next.js 16, "Middleware" passou a se chamar "Proxy" — mesma
// função, arquivo renomeado (proxy.ts na raiz do projeto).
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
