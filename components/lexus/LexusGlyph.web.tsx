import * as icons from "lucide-react";
import React from "react";

type GlyphName = keyof typeof icons;

interface LexusGlyphProps {
  name: GlyphName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export default function LexusGlyph({
  name,
  size = 18,
  color = "currentColor",
  strokeWidth = 1.8,
  className,
}: LexusGlyphProps) {
  // eslint-disable-next-line import/namespace
  const Glyph = icons[name] as React.ComponentType<any> | undefined;
  if (!Glyph) return null;
  return <Glyph size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}