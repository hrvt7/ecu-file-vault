export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Override the dark class from root layout for the public share page
  return (
    <div className="contents" style={{ colorScheme: "light" }}>
      <style>{`
        html:has(.share-page) { color-scheme: light; }
      `}</style>
      <div className="share-page">{children}</div>
    </div>
  );
}
