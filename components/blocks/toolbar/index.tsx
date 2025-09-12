import { Button } from "@/components/ui/button";
import { Button as ButtonType } from "@/types/blocks/base";
import Icon from "@/components/icon";
import Link from "next/link";

export default function Toolbar({ items }: { items?: ButtonType[] }) {
  return (
    <div className="flex space-x-4 mb-8">
      {items?.map((item, idx) => (
        <Button
          key={idx}
          variant={item.variant === "outline" ? "outline" : "default"}
          size="sm"
          className={`
            ${item.variant === "outline" 
              ? "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30" 
              : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white border-0"
            } 
            ${item.className}
          `}
        >
          <Link
            href={item.url || ""}
            target={item.target}
            className="flex items-center gap-1"
          >
            {item.title}
            {item.icon && <Icon name={item.icon} />}
          </Link>
        </Button>
      ))}
    </div>
  );
}
