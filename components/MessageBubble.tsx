import React from 'react';
import { Message, Sender, GroundingChunk } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const parseStructuredResponse = (text: string) => {
  const lines = text.split('\n');
  const sections: { title: string; content: string }[] = [];
  let currentTitle = '';
  let currentContent = '';

  lines.forEach((line) => {
    // Check for "Title:" pattern
    const match = line.match(/^([A-Za-z\s]+):(.+)/);
    if (match) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentContent.trim() });
      }
      currentTitle = match[1].trim();
      currentContent = match[2].trim() + '\n';
    } else {
      currentContent += line + '\n';
    }
  });
  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentContent.trim() });
  }

  // Fallback if no structure detected
  if (sections.length === 0) {
    return [{ title: '', content: text }];
  }
  return sections;
};

const GroundingSources = ({ chunks }: { chunks: GroundingChunk[] }) => {
  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-xs font-semibold text-gray-500 mb-2">Verified Sources & Locations:</p>
      <div className="flex flex-wrap gap-2">
        {chunks.map((chunk, idx) => {
          if (chunk.web) {
            return (
              <a
                key={idx}
                href={chunk.web.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:underline truncate max-w-[200px]"
              >
                🔗 {chunk.web.title}
              </a>
            );
          }
          if (chunk.maps) {
             return (
              <a
                key={idx}
                href={chunk.maps.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:underline truncate max-w-[200px]"
              >
                📍 {chunk.maps.title}
              </a>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.USER;
  const sections = !isUser ? parseStructuredResponse(message.text) : [];

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm text-sm md:text-base">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 w-full">
      <div className="bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm w-full max-w-2xl shadow-sm overflow-hidden">
        {/* Header Strip for AI Identity */}
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Udaipur City Assistant</span>
        </div>

        <div className="p-5 space-y-4">
          {sections.length > 0 && sections[0].title !== '' ? (
            sections.map((section, idx) => (
              <div key={idx} className="border-l-2 border-blue-500 pl-4">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                  {section.title}
                </h3>
                <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap text-gray-700">
                  {section.content}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap text-gray-700">
              {message.text}
            </div>
          )}

          {/* Action Buttons for specific intents */}
          {message.text.includes("Complaint Draft:") && (
            <div className="mt-4 flex gap-3">
              <button 
                onClick={() => navigator.clipboard.writeText(message.text)}
                className="flex items-center justify-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-black transition-colors"
              >
                Copy Draft
              </button>
              <button className="flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded hover:bg-blue-200 transition-colors">
                Find Authority Contact
              </button>
            </div>
          )}
          
          {message.text.includes("SOS Message") && (
            <div className="mt-4">
               <a href="tel:112" className="block w-full text-center px-4 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 shadow-md">
                 CALL 112 (EMERGENCY)
               </a>
            </div>
          )}

          {message.groundingChunks && <GroundingSources chunks={message.groundingChunks} />}
        </div>
      </div>
    </div>
  );
};
