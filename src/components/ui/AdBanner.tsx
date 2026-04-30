import { Megaphone } from 'lucide-react';

export default function AdBanner() {
  return (
    <div className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center text-zinc-500 my-6">
      <div className="flex items-center space-x-2 mb-1">
        <Megaphone className="w-4 h-4" />
        <span className="text-xs uppercase tracking-widest font-black">Advertisement</span>
      </div>
      <div className="bg-zinc-900 w-full max-w-[320px] h-[50px] flex items-center justify-center text-xs border border-zinc-700">
        AdSense Placeholder
      </div>
    </div>
  );
}
