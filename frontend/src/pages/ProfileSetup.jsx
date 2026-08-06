import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import api from "../lib/api";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { setProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [classYear, setClassYear] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.put("/profile", { fullName, faculty, classYear });
      setProfile(res.data.profile);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong saving your profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Complete your profile</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Tell us a bit about yourself
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="fullName"
            label="Full name"
            placeholder="e.g. Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            id="faculty"
            label="Faculty / School"
            placeholder="e.g. Faculty of Engineering"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            required
          />
          <Input
            id="classYear"
            label="Class / Year"
            placeholder="e.g. Year 2"
            value={classYear}
            onChange={(e) => setClassYear(e.target.value)}
            required
          />
          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
