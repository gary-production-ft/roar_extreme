import React from 'react';

interface FormattedMessageProps {
  content: string;
}

/**
 * Parses inline formatting: **bold**, *italic*, `code`, and [links](url)
 */
function renderInlineFormattedText(text: string): React.ReactNode[] {
  // Regex to split by markdown tokens: **bold**, *italic*, `code`, [link](url), or /register
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\/register)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-white tracking-wide">
          {inner}
        </strong>
      );
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-white/80">
          {inner}
        </em>
      );
    }

    // Code: `code`
    if (part.startsWith('`') && part.endsWith('`')) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-black/60 border border-white/10 font-mono text-[11px] text-[#FF5A1F]"
        >
          {inner}
        </code>
      );
    }

    // Markdown link: [text](url)
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        return (
          <a
            key={index}
            href={match[2]}
            className="text-[#FF5A1F] hover:underline font-semibold"
            target={match[2].startsWith('http') ? '_blank' : '_self'}
            rel="noopener noreferrer"
          >
            {match[1]}
          </a>
        );
      }
    }

    // Direct route shorthand: /register
    if (part === '/register') {
      return (
        <a
          key={index}
          href="#free-session"
          className="text-[#FF5A1F] font-bold hover:underline"
        >
          Free Pass Portal
        </a>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content }) => {
  if (!content) return null;

  // Split lines into blocks
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="my-2 space-y-1.5 pl-1">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-white/90">
                <span className="font-mono text-[#FF5A1F] font-bold text-xs shrink-0 select-none">
                  {idx + 1}.
                </span>
                <div className="flex-1 leading-relaxed">{item}</div>
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-2 space-y-1 pl-1">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-white/90">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] mt-1.5 shrink-0 select-none" />
                <div className="flex-1 leading-relaxed">{item}</div>
              </li>
            ))}
          </ul>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    // Check for ordered list: "1. ", "1) ", "१. "
    const orderedMatch = line.match(/^(\d+|[०-९]+)[\.\)]\s*(.*)/);
    if (orderedMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(renderInlineFormattedText(orderedMatch[2]));
      return;
    }

    // Check for unordered bullet list: "- ", "* ", "• "
    const bulletMatch = line.match(/^[-*•]\s*(.*)/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(renderInlineFormattedText(bulletMatch[1]));
      return;
    }

    // Regular line, flush any active list
    flushList();

    // Header 3 or 4: ### Title
    if (line.startsWith('###')) {
      elements.push(
        <h4 key={idx} className="font-heading font-black text-sm text-[#FF5A1F] uppercase tracking-wider mt-3 mb-1">
          {renderInlineFormattedText(line.replace(/^###\s*/, ''))}
        </h4>
      );
      return;
    }

    // Paragraph
    elements.push(
      <p key={idx} className="leading-relaxed text-white/90 my-1">
        {renderInlineFormattedText(line)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-0.5 select-text text-[12.5px] font-sans">{elements}</div>;
};

