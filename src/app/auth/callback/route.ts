import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(`${origin}/login?error=callback`);
    }

    // Check if user has settings — if not, redirect to onboarding
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!settings) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
