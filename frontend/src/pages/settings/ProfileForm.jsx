import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import api, { API_ORIGIN } from "../../lib/api";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AvatarUploadModal from "./AvatarUploadModal";
import { Check, Camera } from "lucide-react";

function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : "?";
}

export default function ProfileForm() {
  const { user, profile, setProfile } = useAuth();

  const [fullName, setFullName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [classYear, setClassYear] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && profile) {
      setFullName(profile.full_name ?? "");
      setFaculty(profile.faculty ?? "");
      setClassYear(profile.class_year ?? "");
      initializedRef.current = true;
    }
  }, [profile]);

  const initials = getInitials(fullName || profile?.full_name, user?.email);
  const avatarSrc = profile?.avatar_url ? `${API_ORIGIN}${profile.avatar_url}` : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaved(false);

    const nextErrors = {};
    if (!fullName.trim()) nextErrors.fullName = "Full name is required";
    if (!faculty.trim()) nextErrors.faculty = "Faculty is required";
    if (!classYear.trim()) nextErrors.classYear = "Class/year is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const { data } = await api.put("/profile", {
        fullName: fullName.trim(),
        faculty: faculty.trim(),
        classYear: classYear.trim(),
      });
      setProfile(data.profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Save profile error:", err);
      setErrors({
        form: err?.response?.data?.error || "Something went wrong saving your profile",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => setAvatarModalOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 shrink-0 rounded-md cursor-pointer
            border-2 border-[var(--color-border)]
            transition-colors duration-300 ease-out
            hover:border-[var(--color-primary)]
            focus-visible:outline-none focus-visible:border-[var(--color-primary)]"
        >
          <span
            className="relative flex items-center justify-center w-full h-full rounded-sm overflow-hidden
              bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-lg font-semibold"
          >
        {avatarSrc ? (
          <>
            <img
              src={avatarSrc}
              alt="Profile"
              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
            />
            <span
              className="pointer-events-none absolute inset-0 mix-blend-color
                bg-[var(--color-primary)] opacity-15"
            />
          </>
        ) : (
          <span>{initials}</span>
        )}
            <span
              className="absolute inset-0 flex items-center justify-center bg-black/50
                opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
            >
              <span
                className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary)]
                  scale-75 transition-transform duration-300 ease-out delay-75 group-hover:scale-100"
              >
                <Camera size={14} className="text-white" />
              </span>
            </span>
          </span>
        </button>

        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">Profile</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="fullName"
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          placeholder="Your full name"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="faculty"
            label="Faculty"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            error={errors.faculty}
            placeholder="e.g. Computer Science"
          />
          <Input
            id="classYear"
            label="Class / Year"
            value={classYear}
            onChange={(e) => setClassYear(e.target.value)}
            error={errors.classYear}
            placeholder="e.g. Info 06"
          />
        </div>

        {errors.form && <p className="text-xs text-[var(--color-danger)]">{errors.form}</p>}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-[var(--color-primary)]">
              <Check size={16} /> Saved
            </span>
          )}
        </div>
      </form>

      <AvatarUploadModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onUploaded={(updatedProfile) => setProfile(updatedProfile)}
        profile={profile}
      />
    </div>
  );
}
