import ProfileForm from "./ProfileForm";
import GroupSection from "./GroupSection";
import { AppearanceCard, TipsCard } from "./SettingsSidebar";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Manage your profile and how your timetables are personalized.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        <ProfileForm />
        <GroupSection />
        <AppearanceCard />
      </div>

      <TipsCard />
    </div>
  );
}
