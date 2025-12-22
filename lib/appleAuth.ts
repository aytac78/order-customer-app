import { supabase } from './supabase';

// Apple Sign In configuration
export async function signInWithApple() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'name email',
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Apple Sign In error:', error);
    return { data: null, error };
  }
}

// Handle the OAuth callback
export async function handleAuthCallback() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (session?.user) {
      // Check if this is a new user and needs profile setup
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        // Create initial profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
            avatar_url: session.user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      return { session, error: null };
    }

    return { session: null, error: null };
  } catch (error) {
    console.error('Auth callback error:', error);
    return { session: null, error };
  }
}

// Check if Apple Sign In is available
export function isAppleSignInAvailable(): boolean {
  // Apple Sign In is available on iOS Safari and macOS Safari
  // Also available via Supabase OAuth on all platforms
  return true;
}

// Sign out
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear any local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('order-user');
      localStorage.removeItem('order-cart');
    }
    
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
}
