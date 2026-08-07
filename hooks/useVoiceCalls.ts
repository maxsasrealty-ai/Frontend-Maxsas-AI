import { useCallsContext } from "../context/CallsContext";

export function useVoiceCalls() {
  const {
    voiceCallsResult,
    voiceCallDetailById,
    isVoiceLoading,
    refreshVoiceCalls,
    loadVoiceCallDetail,
  } = useCallsContext();

  return {
    voiceCallsResult,
    voiceCallDetailById,
    isVoiceLoading,
    refreshVoiceCalls,
    loadVoiceCallDetail,
  };
}
