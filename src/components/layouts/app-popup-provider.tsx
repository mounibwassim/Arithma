"use client";

import dynamic from "next/dynamic";

const KeyboardShortcutsPopup = dynamic(
  () =>
    import("@/components/keyboard-shortcuts-popup").then(
      (mod) => mod.KeyboardShortcutsPopup,
    ),
  {
    ssr: false,
  },
);

const ChatPreferencesPopup = dynamic(
  () =>
    import("@/components/chat-preferences-popup").then(
      (mod) => mod.ChatPreferencesPopup,
    ),
  {
    ssr: false,
  },
);

const ArithmaVoice = dynamic(
  () => import("@/components/chat-bot-voice").then((mod) => mod.ArithmaVoice),
  {
    ssr: false,
  },
);

const ArithmaTemporary = dynamic(
  () =>
    import("@/components/chat-bot-temporary").then(
      (mod) => mod.ArithmaTemporary,
    ),
  {
    ssr: false,
  },
);

const McpCustomizationPopup = dynamic(
  () =>
    import("@/components/mcp-customization-popup").then(
      (mod) => mod.McpCustomizationPopup,
    ),
  {
    ssr: false,
  },
);

const UserSettingsPopup = dynamic(
  () =>
    import("@/components/user/user-detail/user-settings-popup").then(
      (mod) => mod.UserSettingsPopup,
    ),
  {
    ssr: false,
  },
);

export function AppPopupProvider({
  userSettingsComponent,
}: {
  userSettingsComponent: React.ReactNode;
}) {
  return (
    <>
      <KeyboardShortcutsPopup />
      <ChatPreferencesPopup />
      <UserSettingsPopup userSettingsComponent={userSettingsComponent} />
      <ArithmaVoice />
      <ArithmaTemporary />
      <McpCustomizationPopup />
    </>
  );
}
