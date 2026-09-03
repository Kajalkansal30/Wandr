const tagColors = {
  Minimal: "bg-warm-50 text-warm-600 border-warm-100",
  Cozy: "bg-terracotta-50 text-terracotta-500 border-terracotta-100",
  Garden: "bg-sage-50 text-sage-500 border-sage-100",
  Aesthetic: "bg-lavender-50 text-lavender-500 border-lavender-100",
  Floral: "bg-blush-50 text-blush-500 border-blush-100",
  Bright: "bg-gold-50 text-gold-400 border-gold-100",
  Rustic: "bg-warm-100 text-warm-600 border-warm-200",
  Quiet: "bg-sage-50 text-sage-400 border-sage-100",
  Warm: "bg-terracotta-50 text-terracotta-400 border-terracotta-100",
  Artsy: "bg-lavender-50 text-lavender-500 border-lavender-100",
  Peaceful: "bg-sage-50 text-sage-400 border-sage-100",
  Green: "bg-sage-50 text-sage-500 border-sage-100",
  Rooftop: "bg-gold-50 text-gold-400 border-gold-100",
  "Pet Friendly": "bg-sage-50 text-sage-500 border-sage-100",
};

export default function Badge({ label }) {
  const colors = tagColors[label] || "bg-warm-50 text-warm-500 border-warm-100";

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors}`}>
      {label}
    </span>
  );
}
