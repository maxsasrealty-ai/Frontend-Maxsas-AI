import * as icons from "lucide-react-native";
import React from "react";

type IconName = keyof typeof icons;

interface LexusIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function LexusIcon({
  name,
  size = 18,
  color = "#ffffff",
  strokeWidth = 1.8,
}: LexusIconProps) {
  // eslint-disable-next-line import/namespace
  const Icon = icons[name] as React.ComponentType<any> | undefined;
  if (!Icon) return null;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}