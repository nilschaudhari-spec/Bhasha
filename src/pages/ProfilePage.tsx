import { useAuth } from '../context/AuthContext';
import { logout } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { User, LogOut, Settings, Award } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(profile?.dailyGoal || 50);

  const handleUpdateGoal = async () => {
    if (!user || !profile) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        dailyGoal: Number(goalInput),
        updatedAt: Date.now()
      });
      setEditingGoal(false);
      refreshProfile();
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  if (!profile) return null;

  const joinedDate = new Date(profile.createdAt).toLocaleDateString();

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto w-full">
      <div className="flex items-center space-x-6 border-b border-zinc-800 pb-8 mb-8 pt-4">
        <div className="w-24 h-24 rounded-full bg-blue-500/20 border-4 border-blue-500 flex items-center justify-center text-blue-500 overflow-hidden">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
             <User className="w-12 h-12" />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-black">{profile.displayName}</h1>
          <p className="text-zinc-500 font-bold">Joined {joinedDate}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 text-white">Statistics</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center space-x-4">
           <Award className="w-8 h-8 text-yellow-500" />
           <div>
             <div className="text-2xl font-black">{profile.xp}</div>
             <div className="text-xs text-zinc-500 uppercase font-bold text-yellow-500/80">Total XP</div>
           </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center space-x-4">
           <div className="text-2xl">🔥</div>
           <div>
             <div className="text-2xl font-black">{profile.streak}</div>
             <div className="text-xs text-zinc-500 uppercase font-bold text-orange-500/80">Day Streak</div>
           </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 text-white">Daily Goal</h2>
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-12">
        {!editingGoal ? (
          <div className="flex justify-between items-center">
            <div>
              <div className="text-3xl font-black text-green-400">{profile.dailyGoal} <span className="text-sm text-zinc-500">XP / day</span></div>
            </div>
            <Button variant="outline" onClick={() => setEditingGoal(true)} className="border-zinc-700">
              Edit
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <input 
              type="number" 
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value as any)}
              className="bg-zinc-950 border-2 border-zinc-700 rounded-xl px-4 py-2 w-24 text-white font-bold font-mono outline-none focus:border-green-500"
            />
            <Button onClick={handleUpdateGoal} className="bg-green-500 text-black">Save</Button>
            <Button variant="ghost" onClick={() => setEditingGoal(false)}>Cancel</Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
         <h2 className="text-xl font-bold text-white mb-2">Settings</h2>
         <Button variant="outline" className="w-full justify-start text-zinc-400 border-zinc-800 hover:bg-zinc-900" disabled>
           <Settings className="w-5 h-5 mr-4" /> Preferences (Coming next week)
         </Button>
         <Button variant="destructive" className="w-full justify-start border-none" onClick={logout}>
           <LogOut className="w-5 h-5 mr-4" /> Sign Out
         </Button>
      </div>
    </div>
  );
}
