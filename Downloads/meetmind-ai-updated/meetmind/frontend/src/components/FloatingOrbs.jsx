export default function FloatingOrbs({ variant = "default" }) {
  if (variant === "minimal") {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-clay/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-glow-light/10 rounded-full blur-3xl animate-float-delay" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-clay/15 rounded-full blur-[100px] animate-float" />
      <div className="absolute top-[40%] right-[-15%] w-[600px] h-[600px] bg-glow-light/10 rounded-full blur-[120px] animate-float-delay" />
      <div className="absolute bottom-[-15%] left-[20%] w-[450px] h-[450px] bg-clay-bright/10 rounded-full blur-[100px] animate-float" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(110, 231, 183, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(110, 231, 183, 0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
