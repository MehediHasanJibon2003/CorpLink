import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentUser) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (error) {
      console.error("Profile fetch error:", error.message);
      setProfile(null);
      return;
    }

    // Fetch company name to display in the UI
    if (data && data.company_id) {
      const { data: companyData } = await supabase
        .from("companies")
        .select("name")
        .eq("id", data.company_id)
        .single();

      if (companyData) {
        data.companies = { name: companyData.name };
      }

      // Fetch employee ID for this user so we can query tasks assigned to them
      if (currentUser.email) {
        const { data: empData } = await supabase
          .from("employees")
          .select("id")
          .eq("email", currentUser.email)
          .eq("company_id", data.company_id)
          .maybeSingle();

        if (empData) {
          data.employee_id = empData.id;
        } else if (data.role === 'corporate_admin') {
          const { data: newEmp } = await supabase.from("employees").insert([{
            user_id: currentUser.id,
            company_id: data.company_id,
            name: data.full_name || currentUser.email?.split('@')[0] || "Admin",
            email: currentUser.email,
            role: "corporate_admin",
            designation: "Corporate Admin"
          }]).select("id").maybeSingle();
          if (newEmp) {
            data.employee_id = newEmp.id;
          }
        }
      }
    }

    setProfile(data);

    if (data && data.is_blocked) {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        setLoading(true);
        fetchProfile(currentUser).finally(() => {
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    if (user && profile?.company_id) {
      try {
        await supabase.from("activity_logs").insert([
          {
            company_id: profile.company_id,
            user_id: user.id,
            action: "System Logout",
            entity: "auth",
            severity: "info",
            status: "success",
          },
        ]);
      } catch (e) {
        console.error("Failed to log logout action", e);
      }
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
