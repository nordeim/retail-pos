"use client";

// The /login route. useSearchParams lives in the surface? No — this page is
// deliberately search-param free (the reset token flow passes through the
// forgot-password response, not the URL), so no Suspense boundary dance.
import { LoginSurface } from "@/components/auth/login-surface";

export default function LoginPage() {
  return <LoginSurface />;
}
