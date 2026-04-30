import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COURSES, Lesson, LessonChallenge } from '../data/courseData';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { X, Check, Heart, Mic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, collection, setDoc, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export default function LessonPage() {
  const { courseId, unitId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hearts, setHearts] = useState(5);
  const [xpEarned, setXpEarned] = useState(0);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedSpeech, setRecognizedSpeech] = useState<string | null>(null);

  useEffect(() => {
    const course = COURSES.find(c => c.id === courseId);
    const unit = course?.units.find(u => u.id === unitId);
    if (unit) {
      const foundLesson = unit.lessons.find(l => l.id === lessonId);
      if (foundLesson) setLesson(foundLesson);
    }
  }, [courseId, unitId, lessonId]);

  if (!lesson) return <div className="p-8 text-center text-white">Loading...</div>;

  const challenge = lesson.challenges[currentChallengeIndex];
  const progressPercent = (currentChallengeIndex / lesson.challenges.length) * 100;

  const handleStartRecording = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = challenge.speechLang || 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onspeechend = () => recognition.stop();
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      setRecognizedSpeech(transcript);
      setSelectedAnswer(transcript);
      setIsRecording(false);
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };
    
    recognition.start();
  };

  const cleanString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  const handleCheck = () => {
    if (!selectedAnswer) return;
    
    let correct = false;
    if (challenge.type === 'pronunciation') {
       // Allow if they said the word anywhere in their speech
       correct = cleanString(selectedAnswer).includes(cleanString(challenge.answer));
    } else {
       correct = selectedAnswer === challenge.answer;
    }
    
    setIsCorrect(correct);
    if (!correct) {
      setHearts(h => Math.max(0, h - 1));
    }
  };

  const handleNext = async () => {
    setIsCorrect(null);
    setSelectedAnswer(null);
    setRecognizedSpeech(null);

    if (currentChallengeIndex < lesson.challenges.length - 1) {
      if (hearts === 0) {
        // Failed
        navigate('/');
      } else {
        setCurrentChallengeIndex(i => i + 1);
      }
    } else {
       // Complete lesson setup
       setLessonComplete(true);
    }
  };

  const completeLessonAndSave = async () => {
    if (user && profile) {
      try {
        const docRef = doc(db, 'users', user.uid);
        const currentCompleted = profile.completedLessons || [];
        const isAlreadyCompleted = currentCompleted.includes(lesson.id);
        const newCompleted = isAlreadyCompleted 
          ? currentCompleted 
          : [...currentCompleted, lesson.id];

        await updateDoc(docRef, {
          xp: profile.xp + lesson.xpReward,
          weeklyXp: profile.weeklyXp + lesson.xpReward,
          completedLessons: newCompleted,
          updatedAt: Date.now()
        });

        // Add vocabulary items to spaced repetition if this is the first time completing the lesson
        if (!isAlreadyCompleted && lesson.vocabularyItems) {
          // fetch existing vocabulary to avoid exact duplicates
          const q = query(collection(db, 'vocabulary'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const existingWords = querySnapshot.docs.map(doc => doc.data().word.toLowerCase());

          for (const vocab of lesson.vocabularyItems) {
            if (!existingWords.includes(vocab.word.toLowerCase())) {
              const newVocabId = doc(collection(db, 'vocabulary')).id;
              await setDoc(doc(db, 'vocabulary', newVocabId), {
                userId: user.uid,
                languageId: vocab.languageId,
                word: vocab.word,
                translation: vocab.translation,
                srsStage: 0,
                nextReviewDate: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now()
              });
            }
          }
        }

        await refreshProfile();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
    navigate('/');
  };

  if (lessonComplete) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="bg-zinc-900 border-2 border-yellow-500 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(234,179,8,0.2)]"
        >
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-black text-yellow-500 mb-2">Lesson Complete!</h2>
          <p className="text-zinc-300 font-bold mb-8">You earned +{lesson.xpReward} XP</p>
          <Button size="lg" className="w-full bg-yellow-500 text-black hover:bg-yellow-400" onClick={completeLessonAndSave}>
            Continue
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center space-x-4">
        <button onClick={() => navigate('/')} className="text-zinc-500 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <Progress value={progressPercent} className="flex-1" />
        <div className="flex items-center space-x-2 text-red-500 font-bold">
          <Heart className="w-6 h-6 fill-current" />
          <span>{hearts}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 pt-8 max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-black text-white mb-8">{challenge?.question}</h2>

        {challenge?.type === 'multiple_choice' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {challenge.options?.map((opt) => (
              <button
                key={opt}
                onClick={() => !isCorrect && setSelectedAnswer(opt)}
                className={`p-4 rounded-xl border-2 text-left font-bold text-lg transition-all
                  ${selectedAnswer === opt 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                    : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  }
                  ${isCorrect === true && selectedAnswer === opt ? 'border-green-500 bg-green-500/10 text-green-400' : ''}
                  ${isCorrect === false && selectedAnswer === opt ? 'border-red-500 bg-red-500/10 text-red-400' : ''}
                `}
                disabled={isCorrect !== null}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {challenge?.type === 'translate_to_source' && (
          <div className="flex flex-col space-y-8">
             <div className="p-6 bg-zinc-900 border-2 border-zinc-800 rounded-2xl flex items-center mb-8">
               <div className="w-12 h-12 bg-blue-500 rounded-full mr-4 flex-shrink-0" />
               <div className="bg-zinc-800 border-2 border-zinc-700 p-4 rounded-2xl rounded-tl-none text-xl font-bold">
                 {challenge.question}
               </div>
             </div>
             <div className="flex flex-wrap gap-2 justify-center">
               {challenge.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => !isCorrect && setSelectedAnswer(opt)}
                  className={`px-4 py-3 rounded-xl border-b-4 font-bold text-lg transition-all
                    ${selectedAnswer === opt ? 'bg-zinc-700 border-zinc-900 text-zinc-500' : 'bg-zinc-800 border-zinc-950 hover:bg-zinc-700 text-white'}
                  `}
                  disabled={isCorrect !== null}
                >
                  {opt}
                </button>
               ))}
             </div>
          </div>
        )}

        {challenge?.type === 'pronunciation' && (
          <div className="flex flex-col items-center justify-center space-y-8 flex-1">
            <div className="text-3xl font-black text-center p-8 bg-zinc-900 border-2 border-zinc-800 rounded-3xl w-full">
              {challenge.answer}
            </div>
            
            <button
              onClick={handleStartRecording}
              disabled={isCorrect !== null || isRecording}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)] scale-110 animate-pulse text-white outline outline-4 outline-red-500/30' 
                  : 'bg-zinc-800 text-green-500 hover:bg-zinc-700 hover:scale-105 active:scale-95 border-b-8 border-zinc-950'
              }`}
            >
               <Mic className="w-12 h-12" />
            </button>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm h-6">
              {isRecording ? "Listening..." : "Tap to speak"}
            </p>
            
            {recognizedSpeech && !isRecording && (
              <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 mt-4 text-center w-full">
                <p className="text-xs text-zinc-500 uppercase font-bold mb-3">You said:</p>
                <div className="text-xl font-bold flex flex-wrap justify-center gap-2">
                  {recognizedSpeech.split(' ').map((word, i) => {
                     const isWordExpected = challenge.answer.toLowerCase().includes(word.toLowerCase());
                     return (
                        <span key={i} className={isWordExpected ? "text-green-400" : "text-red-400 line-through"}>
                          {word}
                        </span>
                     );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {challenge?.type === 'fill_in_the_blank' && (
          <div className="flex flex-col space-y-8">
             <div className="p-8 bg-zinc-900 border-2 border-zinc-800 rounded-2xl flex items-center mb-8 justify-center min-h-[160px]">
               <div className="text-2xl font-bold flex flex-wrap items-center justify-center gap-2">
                 {challenge.question.split('___').map((part, i, arr) => (
                    <span key={i} className="flex items-center">
                      <span>{part}</span>
                      {i < arr.length - 1 && (
                        <span className={`inline-flex items-center justify-center min-w-[100px] min-h-[44px] border-b-4 mx-2 px-4 py-1 text-center rounded-xl transition-all ${
                          selectedAnswer ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-zinc-700 text-zinc-500 bg-zinc-800'
                        } ${isCorrect === true && selectedAnswer ? 'border-green-500 text-green-400 bg-green-500/10' : ''} ${isCorrect === false && selectedAnswer ? 'border-red-500 text-red-400 bg-red-500/10' : ''}`}>
                          {selectedAnswer || ''}
                        </span>
                      )}
                    </span>
                 ))}
               </div>
             </div>
             <div className="flex flex-wrap gap-4 justify-center">
               {challenge.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => !isCorrect && setSelectedAnswer(opt)}
                  className={`px-8 py-4 rounded-xl border-b-4 font-bold text-xl transition-all
                    ${selectedAnswer === opt ? 'bg-zinc-700 border-zinc-900 text-zinc-500 translate-y-1 border-b-0' : 'bg-zinc-800 border-zinc-950 hover:bg-zinc-700 active:translate-y-1 active:border-b-0 text-white'}
                  `}
                  disabled={isCorrect !== null}
                >
                  {opt}
                </button>
               ))}
             </div>
          </div>
        )}
      </div>

      {/* Footer Area */}
      <AnimatePresence>
        {isCorrect !== null && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className={`fixed bottom-0 left-0 right-0 p-6 flex items-center justify-between z-50
              ${isCorrect ? 'bg-green-500/20 text-green-400 border-t-2 border-green-500' : 'bg-red-500/20 text-red-400 border-t-2 border-red-500'}
            `}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-500 text-black' : 'bg-red-500 text-black'}`}>
                {isCorrect ? <Check className="w-8 h-8" /> : <X className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="font-black text-2xl">{isCorrect ? 'Awesome!' : 'Correct solution:'}</h3>
                {!isCorrect && <p className="text-zinc-200 mt-1">{challenge.answer}</p>}
              </div>
            </div>
            <Button size="lg" className={`font-black ${isCorrect ? 'bg-green-500 hover:bg-green-400 text-black' : 'bg-red-500 hover:bg-red-400 text-black'}`} onClick={handleNext}>
              CONTINUE
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!isCorrect && (
        <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex justify-center">
          <Button 
            size="lg" 
            className="w-full max-w-2xl font-black text-lg uppercase" 
            disabled={!selectedAnswer}
            onClick={handleCheck}
          >
            Check
          </Button>
        </div>
      )}
    </div>
  );
}
