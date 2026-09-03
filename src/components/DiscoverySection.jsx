export default function DiscoverySection({ title, subtitle, children }) {
  return (
    <section className="section-gap animate-fade-in">
      <div className="mb-5">
        <h2
          className="text-lg md:text-xl font-bold text-warm-700 leading-snug"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        {subtitle && <p className="text-sm text-warm-400 mt-1">{subtitle}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}
