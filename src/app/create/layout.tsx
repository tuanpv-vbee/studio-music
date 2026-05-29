import Sidebar from "@/components/Sidebar";

export default function CreateLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-neutral-900 text-white">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Topbar />
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function Topbar() {
  return (
    <header className="h-14 border-b border-neutral-800 px-6 flex items-center justify-between bg-neutral-950/70 backdrop-blur sticky top-0 z-10">
      <div className="text-sm text-neutral-400">
        <span className="text-white font-medium">Create</span>
        <span className="mx-2 opacity-40">/</span>
        <span>Simple</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="px-2 py-1 rounded bg-neutral-800 text-neutral-300 font-mono">
          chirp-auk-turbo
        </span>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600" />
      </div>
    </header>
  );
}
