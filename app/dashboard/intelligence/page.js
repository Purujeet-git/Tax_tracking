import ChatHeader from "@/components/ai/ChatHeader";
import ChatWindow from "@/components/ai/ChatWindow";

export default function IntelligencePage() {
  return (
    <div className="min-h-screen bg-white px-4 py-6 text-black sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl space-y-6">
        <ChatHeader />
        <ChatWindow />
      </main>
    </div>
  );
}
