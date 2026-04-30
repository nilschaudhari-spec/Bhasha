import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Trophy, User, BookOpen } from 'lucide-react';

export default function TabBar() {
  const location = useLocation();

  const tabs = [
    { name: 'Learn', path: '/', icon: Home },
    { name: 'Review', path: '/vocabulary', icon: BookOpen },
    { name: 'Rank', path: '/leaderboard', icon: Trophy },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-900 border-t border-zinc-800 flex justify-around items-center px-2 z-50">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.name}
            to={tab.path}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? 'text-green-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
