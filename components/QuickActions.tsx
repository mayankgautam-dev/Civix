import React from 'react';

interface QuickActionsProps {
  onAction: (text: string) => void;
}

const ACTION_TILES = [
  { label: "Report Pothole", icon: "🚧", prompt: "I need to report a pothole on my street." },
  { label: "Water Supply", icon: "💧", prompt: "There is no water supply in my area today." },
  { label: "Street Lights", icon: "💡", prompt: "Street lights are not working in Sector 4." },
  { label: "Garbage Pickup", icon: "🚛", prompt: "Garbage truck did not come today." },
  { label: "Govt Schemes", icon: "📜", prompt: "What government schemes are available for students?" },
  { label: "Tourist Crowds", icon: "🏰", prompt: "Is City Palace crowded right now?" },
];

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
      {ACTION_TILES.map((tile) => (
        <button
          key={tile.label}
          onClick={() => onAction(tile.prompt)}
          className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-center group"
        >
          <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{tile.icon}</span>
          <span className="text-sm font-medium text-gray-700">{tile.label}</span>
        </button>
      ))}
    </div>
  );
};
