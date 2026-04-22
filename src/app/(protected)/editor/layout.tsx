export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='h-dvh w-screen overflow-hidden flex flex-col bg-zinc-950 text-zinc-100'>
      {children}
    </div>
  );
}