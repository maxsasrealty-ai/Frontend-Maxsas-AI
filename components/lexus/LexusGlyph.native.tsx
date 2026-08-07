import * as icons from "lucide-react-native";
import React from "react";

type GlyphName = keyof typeof icons;

interface LexusGlyphProps {
  name: GlyphName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function LexusGlyph({
  name,
  size = 18,
  color = "#ffffff",
  strokeWidth = 1.8,
}: LexusGlyphProps) {
  // eslint-disable-next-line import/namespace
  const Glyph = icons[name] as React.ComponentType<any> | undefined;
  if (!Glyph) return null;
  return <Glyph size={size} color={color} strokeWidth={strokeWidth} />;
}