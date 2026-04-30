import { Flame as FlameIcon, Gem, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function TopBar() {
  const { profile } = useAuth();

  const dailyGoalReached = profile ? profile.weeklyXp >= profile.dailyGoal : false;

  return (
    <div className="sticky top-0 left-0 right-0 h-16 bg-zinc-950/90 backdrop-blur-md z-40 flex items-center justify-between px-4 border-b border-zinc-800">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center font-black text-black">B</div>
      </div>
      
      {profile && (
        <div className="flex items-center space-x-4">
          <div className="relative">
             <div className={`flex items-center space-x-1 font-bold px-2 py-1 rounded-lg transition-all ${dailyGoalReached ? 'text-orange-400 bg-orange-500/10' : 'text-zinc-500'}`}>
               <FlameIcon className={`w-5 h-5 ${dailyGoalReached ? 'fill-current text-orange-500' : ''}`} />
               <span>{profile.streak}</span>
             </div>
             
             {/* Daily Streak Bonus Indicator */}
             <AnimatePresence>
               {dailyGoalReached && (
                 <motion.div 
                   initial={{ scale: 0, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="absolute -top-1 -right-2 bg-yellow-500 rounded-full text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                 >
                   <CheckCircle2 className="w-3 h-3 m-0.5" />
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
          <div className="flex items-center space-x-1 text-cyan-400 font-bold px-2 py-1">
            <Gem className="w-5 h-5 fill-current" />
            <span>{profile.coins}</span>
          </div>
        </div>
      )}
    </div>
  );
}
