import Header from "../components/Header";

export function SettingsPage() {
  return (
    <div>
      <Header title="Settings" subtitle="Configure SentinelDNA" />
      <div className="p-4 md:p-8">
        <div className="bg-white rounded-xl border border-[#ECF0F1] shadow-sm p-10 text-center text-sm text-[#7F8C8D]">
          Set VITE_API_BASE_URL in a .env file at the project root to point the frontend at your FastAPI backend.
        </div>
      </div>
    </div>
  );
}
