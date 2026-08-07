import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
  const { user, profile } = useAuth();

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--color-text)]">
        Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mt-1">{user?.email}</p>
    </div>
  );
}
