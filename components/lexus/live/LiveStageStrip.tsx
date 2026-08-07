import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { LiveCallSnapshot } from "../../../context/CallsContext";
import { useLexusTheme } from "../../../context/LexusThemeContext";
import { liveStageLabel, liveStageTone } from "../../../lib/adapters/liveEvents";
import StatusPill from "../StatusPill";
import { LEXUS_FONTS } from "../theme";

interface LiveStageStripProps {
  snapshot: LiveCallSnapshot;
}

export default function LiveStageStrip({ snapshot }: LiveStageStripProps) {
  const { colors } = useLexusTheme();

  return (
    <View style={styles.wrap}>
      <StatusPill label={liveStageLabel(snapshot.stage)} tone={liveStageTone(snapshot.stage)} />
      {snapshot.partialTranscript ? (
        <Text style={[styles.preview, { color: colors.text }]} numberOfLines={2}>
          {snapshot.partialTranscript}
        </Text>
      ) : (
        <Text style={[styles.previewMuted, { color: colors.textMuted }]}>Waiting for transcript updates...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    gap: 8,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: LEXUS_FONTS.body,
  },
  previewMuted: {
    fontSize: 13,
    fontFamily: LEXUS_FONTS.body,
  },
});
