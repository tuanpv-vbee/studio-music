const COLOR: Record<string, string> = {
  complete: 'bg-green-700',
  streaming: 'bg-blue-700',
  error: 'bg-red-700',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-[10px] uppercase px-2 py-0.5 rounded ${COLOR[status] ?? 'bg-neutral-700'}`}
    >
      {status}
    </span>
  );
}
