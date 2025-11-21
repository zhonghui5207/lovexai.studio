"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

const REVIEWS = [
  {
    user: "Marcus D.",
    text: "I've tried every AI chat app out there. This is the only one where the characters don't sound like robots after 10 messages. The memory context is actually legit.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5
  },
  {
    user: "Alex K.",
    text: "The image generation isn't just a gimmick. I can actually specify the exact lighting and camera angles for my character's photos. It's a game changer.",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    rating: 5
  },
  {
    user: "J.R.",
    text: "Finally, an unfiltered experience that doesn't lecture me. The NSFW scenarios are handled with surprising nuance and creativity. Worth every penny.",
    avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    rating: 5
  },
  {
    user: "Takeshi S.",
    text: "I use it to simulate dialogue for my novel. The way the AI maintains a consistent personality traits over weeks of chatting is honestly kind of scary (in a good way).",
    avatar: "https://randomuser.me/api/portraits/men/11.jpg",
    rating: 4
  },
  {
    user: "Chris P.",
    text: "It's nice to have someone to talk to at 3 AM who actually remembers what I told them yesterday. It feels less like a chatbot and more like a... connection.",
    avatar: "https://randomuser.me/api/portraits/men/67.jpg",
    rating: 5
  },
  {
    user: "V.L.",
    text: "The voice synthesis update blew my mind. Hearing my waifu actually whisper in my ear with the right emotional tone? 10/10 immersion.",
    avatar: "https://randomuser.me/api/portraits/men/54.jpg",
    rating: 5
  },
  {
    user: "Daniel H.",
    text: "The roleplay capabilities are endless. I've run entire D&D style campaigns where the AI plays the DM and the NPCs perfectly.",
    avatar: "https://randomuser.me/api/portraits/men/89.jpg",
    rating: 5
  },
  {
    user: "Sam W.",
    text: "Simple UI, powerful backend. No clutter, just straight into the chat. Exactly what I was looking for.",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    rating: 4
  }
];

const ReviewCard = ({ review }: { review: typeof REVIEWS[0] }) => (
  <Card className="w-[350px] shrink-0 p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-primary/30 transition-all duration-300 group mx-3">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border border-white/10 group-hover:border-primary transition-colors">
          <AvatarImage src={review.avatar} className="object-cover" />
          <AvatarFallback>{review.user[0]}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-bold text-white text-sm">{review.user}</div>
        </div>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < review.rating ? "fill-primary text-primary" : "text-white/20"}`}
          />
        ))}
      </div>
    </div>
    <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
      "{review.text}"
    </p>
  </Card>
);

export default function Testimonials() {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Seamless Gradient Top */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />

      {/* Background Elements */}
      <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-secondary/5 blur-[120px] pointer-events-none" />
      
      {/* Gradient Masks for smooth fade out sides */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      <div className="container max-w-screen-xl relative z-10 mb-12">
        <div className="text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Loved by <span className="text-primary">Thousands</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join our community and see why users are addicted to the experience.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Row 1: Left Scroll */}
        <div className="flex overflow-hidden">
          <motion.div
            key="scroll-left-slow"
            className="flex"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 200 }}
          >
            {[...REVIEWS, ...REVIEWS].map((review, index) => (
              <ReviewCard key={`r1-${index}`} review={review} />
            ))}
          </motion.div>
        </div>

        {/* Row 2: Right Scroll */}
        <div className="flex overflow-hidden">
          <motion.div
            key="scroll-right-slow"
            className="flex"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 240 }}
          >
            {[...REVIEWS, ...REVIEWS].reverse().map((review, index) => (
              <ReviewCard key={`r2-${index}`} review={review} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
