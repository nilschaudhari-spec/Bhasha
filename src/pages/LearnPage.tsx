import { useNavigate } from 'react-router-dom';
import { COURSES, Course } from '../data/courseData';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Star, CheckCircle, Lock, Globe } from 'lucide-react';
import AdBanner from '../components/ui/AdBanner';

export default function LearnPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  
  const currentCourseId = profile?.currentCourseId;
  const course = COURSES.find(c => c.id === currentCourseId);

  const handleSelectCourse = async (courseId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        currentCourseId: courseId,
        updatedAt: Date.now()
      });
      refreshProfile();
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  if (!course) {
    return (
      <div className="p-4 pb-24 max-w-xl mx-auto w-full flex flex-col pt-12 items-center text-center">
        <Globe className="w-16 h-16 text-blue-500 mb-6" />
        <h1 className="text-3xl font-black text-white mb-2">What do you want to learn?</h1>
        <p className="text-zinc-400 mb-12">Choose a language to start your journey.</p>
        
        <div className="grid grid-cols-2 gap-4 w-full">
          {COURSES.map(c => (
            <button
              key={c.id}
              onClick={() => handleSelectCourse(c.id)}
              className="bg-zinc-900 border-2 border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all p-6 rounded-2xl flex flex-col items-center justify-center space-y-4"
            >
              <div className="text-5xl">{c.flag}</div>
              <div className="text-xl font-bold text-white">{c.language}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const completedLessonIds = profile?.completedLessons || [];

  let firstUncompletedFound = false;

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto w-full">
      <div className="mb-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white mb-1"><span className="mr-2">{course.flag}</span>{course.title} Path</h1>
          <p className="text-zinc-400 text-sm">Continue your journey in {course.title}.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => handleSelectCourse('')} className="border-zinc-700 text-xs text-zinc-400">
           Change
        </Button>
      </div>
      
      <AdBanner />

      <div className="space-y-12 relative">
        {/* A simple vertical dotted line for the path */}
        <div className="absolute left-1/2 top-4 bottom-4 w-1 bg-zinc-800 -translate-x-1/2 -z-10 rounded-full" />
        
        {course.units.map((unit, unitIndex) => (
          <div key={unit.id} className="relative z-10 w-full mb-12">
            <div className="text-center mb-6 sticky top-20 z-20">
              <div className="inline-block bg-green-900 border-2 border-green-500 rounded-xl px-4 py-2">
                <h2 className="font-black text-green-400 uppercase tracking-widest text-sm">{unit.title}</h2>
                <span className="text-white font-bold">{unit.description}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-8">
              {unit.lessons.map((lesson, index) => {
                const isCompleted = completedLessonIds.includes(lesson.id);
                
                let isCurrent = false;
                if (!isCompleted && !firstUncompletedFound) {
                  isCurrent = true;
                  firstUncompletedFound = true;
                }
                
                const isLocked = !isCompleted && !isCurrent;
                
                // Add some snake-like indent
                const leftOffsets = ['0', '-40px', '-60px', '-40px', '0', '40px', '60px', '40px'];
                const indent = leftOffsets[index % leftOffsets.length];

                return (
                  <div key={lesson.id} className="relative" style={{ left: indent }}>
                    <button
                      onClick={() => !isLocked && navigate(`/lesson/${course.id}/${unit.id}/${lesson.id}`)}
                      disabled={isLocked}
                      className={`relative w-20 h-20 rounded-full flex items-center justify-center border-b-8 transition-transform 
                        ${!isLocked && 'active:translate-y-2 active:border-b-0'}
                        ${isCompleted ? 'bg-yellow-400 border-yellow-600' : isCurrent ? 'bg-green-500 border-green-700' : 'bg-zinc-700 border-zinc-800'}
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-8 h-8 text-yellow-900" />
                      ) : isLocked ? (
                        <Lock className="w-8 h-8 text-zinc-500" />
                      ) : (
                        <Star className="w-8 h-8 text-green-900 fill-current" />
                      )}
                    </button>
                    {/* Ring for current lesson (first uncompleted) */}
                    {isCurrent && (
                      <div className="absolute -inset-3 border-4 border-green-500/30 rounded-full animate-pulse pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
