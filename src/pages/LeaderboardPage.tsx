import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Trophy, Medal, User } from 'lucide-react';

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('weeklyXp', 'desc'),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const topUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaders(topUsers);
      setLoading(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading leaderboard...</div>;

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto w-full">
      <div className="flex flex-col items-center mb-8 pt-8">
         <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
         <h1 className="text-2xl font-black text-white">Diamond League</h1>
         <p className="text-zinc-400 font-bold">Top 20 learners this week</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden p-2">
         {leaders.map((leader, index) => {
           const isCurrentUser = leader.id === user?.uid;
           
           return (
             <div 
                key={leader.id} 
                className={`flex items-center p-4 rounded-2xl mb-1 ${isCurrentUser ? 'bg-zinc-800 border-2 border-green-500' : 'hover:bg-zinc-800'}`}
             >
                <div className="w-8 font-black text-lg text-zinc-500 flex justify-center">
                  {index === 0 ? <Medal className="w-6 h-6 text-yellow-500" /> : 
                   index === 1 ? <Medal className="w-6 h-6 text-zinc-400" /> : 
                   index === 2 ? <Medal className="w-6 h-6 text-orange-700" /> : 
                   index + 1}
                </div>
                
                <div className="w-12 h-12 ml-4 mr-4 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border border-zinc-700">
                   <User className="w-6 h-6 text-zinc-500" />
                </div>
                
                <div className="flex-1">
                   <div className="font-bold text-lg text-zinc-200">{leader.displayName || 'Learner'}</div>
                   {isCurrentUser && <div className="text-xs text-green-500 font-bold uppercase">You</div>}
                </div>
                
                <div className="font-black text-green-400 text-xl text-right">
                   {leader.weeklyXp} <span className="text-xs">XP</span>
                </div>
             </div>
           );
         })}
      </div>
    </div>
  );
}
