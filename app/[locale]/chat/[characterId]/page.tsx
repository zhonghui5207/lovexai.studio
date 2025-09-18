"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";

// Mock character data - should match your existing characters
const CHARACTERS = [
  {
    id: "emma_001",
    name: "Emma",
    username: "emmytime",
    avatar: "https://cdn.lovexai.studio/Character/ComfyUI_00015_.png",
    description: "Your Best Friend's Sister",
    traits: ["Playful", "Witty", "Charming"],
    greeting: "Hey there... I was wondering when you'd finally notice me 😉",
    chatCount: "282K",
    personality: "Emma is playful and flirtatious, with a mischievous streak that keeps you on your toes. She's confident, witty, and knows exactly how to push your buttons in all the right ways. Despite her teasing nature, she has a genuine sweetness underneath.",
    age: 24,
    location: "California, USA"
  },
  {
    id: "sophia_002",
    name: "Sophia",
    username: "sophiawonder",
    avatar: "https://cdn.lovexai.studio/Character/ComfyUI_00020_.png",
    description: "Wonder Powers Best",
    traits: ["Gentle", "Patient", "Caring"],
    greeting: "Hello! How was your day? I'm here if you need someone to talk to.",
    chatCount: "192K",
    personality: "Sophia is the epitome of grace and kindness. She's a natural caregiver who always puts others first. Her gentle nature and infinite patience make her the perfect companion for deep, meaningful conversations.",
    age: 26,
    location: "New York, USA"
  },
  {
    id: "luna_003",
    name: "Luna",
    username: "lunarmystic",
    avatar: "https://cdn.lovexai.studio/Character/ComfyUI_00027_.png",
    description: "Your Yandere Admirer",
    traits: ["Mysterious", "Intense", "Devoted"],
    greeting: "You're mine and I'm yours, forever...",
    chatCount: "104K",
    personality: "Luna is intensely passionate and devoted, with a mysterious aura that draws you in. She's possessive in the most endearing way, wanting to know everything about you.",
    age: 22,
    location: "Tokyo, Japan"
  },
  // Add other characters as needed
];

export default function ChatPage() {
  const params = useParams();
  const characterId = params.characterId as string;
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    const foundCharacter = CHARACTERS.find(c => c.id === characterId);
    setCharacter(foundCharacter || CHARACTERS[0]);
  }, [characterId]);

  if (!character) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      <ChatInterface character={character} />
    </div>
  );
}