"use client";

import { useParams, useRouter } from "next/navigation";
import TripChatWindow from "../../../components/TripChatWindow";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  return (
    <TripChatWindow 
      tripId={tripId} 
      onBack={() => router.back()} 
      height="calc(100vh - 80px)" 
    />
  );
}
