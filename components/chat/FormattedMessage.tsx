"use client";

import { ReactNode } from "react";

interface FormattedMessageProps {
  content: string;
}

export default function FormattedMessage({ content }: FormattedMessageProps) {
  const parseMessage = (text: string): ReactNode[] => {
    // 用正则表达式匹配 *text* 格式的斜体标记
    const parts = text.split(/(\*[^*]+\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        // 斜体叙述部分 - 移除星号并应用样式
        const narrativeText = part.slice(1, -1);
        return (
          <em
            key={index}
            className="text-white/60 not-italic font-normal"
            style={{ fontStyle: 'italic' }}
          >
            {narrativeText}
          </em>
        );
      }
      // 普通文本部分
      return <span key={index}>{part}</span>;
    });
  };

  return <>{parseMessage(content)}</>;
}