import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : "?";
}

export default function UserMenu() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    let raf1, raf2;
    if (open) {
      setMounted(true);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(timeout);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const initials = getInitials(profile?.full_name, user?.email);

  const items = [
    { label: "Profile", icon: User, onClick: () => navigate("/profile") },
    { label: "Settings", icon: Settings, onClick: () => navigate("/settings") },
    { label: "Log out", icon: LogOut, onClick: logout, danger: true },
  ];

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-9 h-9 rounded-md text-sm font-semibold
          bg-[var(--color-primary)]/10 text-[var(--color-primary)]
          hover:bg-[var(--color-primary)]/20 transition-colors duration-150
          focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initials}
      </button>

      {mounted && (
        <div
          role="menu"
          className={`absolute right-0 mt-4 w-48 rounded-lg border border-[var(--color-border)]
            bg-[var(--color-surface)] shadow-lg p-1 z-30 origin-top-right
            transition-all duration-150 ease-out
            ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1"}`}
        >
          <div className="px-3 py-2 border-b mb-1 border-[var(--color-border)]">
            <p className="text-sm font-medium text-[var(--color-text)] truncate">
              {profile?.full_name || "Student"}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email}</p>
          </div>

          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors rounded-sm
                hover:bg-[var(--color-surface-alt)]
                ${item.danger ? "text-[var(--color-danger)]" : "text-[var(--color-text)]"}`}
            >
              <item.icon size={16} strokeWidth={2} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
