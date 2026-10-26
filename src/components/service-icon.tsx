import { Bath, Car, CookingPot, Droplets, Home, Layers, Sofa, Sparkles, type LucideProps } from "lucide-react";

const ICONS = { Bath, Car, CookingPot, Droplets, Home, Layers, Sofa, Sparkles };

export function ServiceIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Sparkles;
  return <Icon aria-hidden strokeWidth={1.75} {...props} />;
}
