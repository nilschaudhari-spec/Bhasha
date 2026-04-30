import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Layers, CheckCircle2, RotateCcw, Gamepad2, Timer, Play, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function VocabularyPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'srs' | 'game' | 'pronunciation'>('srs');
  const [items, setItems] = useState<any[]>([]);
  const [dueItems, setDueItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // SRS state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Game state
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [gameCards, setGameCards] = useState<any[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const timerRef = useRef<any>(null);

  // Pronunciation game state
  const [pronunciationState, setPronunciationState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [pronunciationList, setPronunciationList] = useState<any[]>([]);
  const [pronunciationIndex, setPronunciationIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [pronunciationFeedback, setPronunciationFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [pronunciationScore, setPronunciationScore] = useState(0);

  useEffect(() => {
    if (user) fetchVocabulary();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user]);

  const fetchVocabulary = async () => {
    try {
      if (!user) return;
      const q = query(
        collection(db, 'vocabulary'), 
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetchedItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setItems(fetchedItems);
      
      const now = Date.now();
      const due = fetchedItems.filter((i: any) => !i.nextReviewDate || i.nextReviewDate <= now);
      setDueItems(due);
      setLoading(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'vocabulary');
      setLoading(false);
    }
  };

  // SRS Logic
  const handleSrsAction = async (quality: 'again' | 'hard' | 'good' | 'easy') => {
    const item = dueItems[currentCardIndex];
    let newStage = item.srsStage || 0;
    
    if (quality === 'again') newStage = 0;
    else if (quality === 'hard') newStage = Math.max(0, newStage - 1);
    else if (quality === 'good') newStage += 1;
    else if (quality === 'easy') newStage += 2;

    const intervals = [12, 24, 72, 168, 336, 720];
    const intervalHours = intervals[Math.min(newStage, intervals.length - 1)];
    const nextReview = Date.now() + intervalHours * 60 * 60 * 1000;

    try {
      await updateDoc(doc(db, 'vocabulary', item.id), {
        srsStage: newStage,
        nextReviewDate: nextReview,
        updatedAt: Date.now()
      });
      
      setShowAnswer(false);
      setCurrentCardIndex(i => i + 1);
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `vocabulary/${item.id}`);
    }
  };

  const seedSampleVocabulary = async () => {
    if (!user) return;
    const sampleWords = [
      { word: 'Namaste', translation: 'Hello/Greetings' },
      { word: 'Haan', translation: 'Yes' },
      { word: 'Nahi', translation: 'No' },
      { word: 'Shukriya', translation: 'Thank you' },
      { word: 'Alvida', translation: 'Goodbye' },
      { word: 'Maa', translation: 'Mother' },
      { word: 'Pita', translation: 'Father' },
      { word: 'Bhai', translation: 'Brother' },
      { word: 'Behen', translation: 'Sister' },
      { word: 'Khana', translation: 'Food' }
    ];

    try {
      for (const sw of sampleWords) {
        const id = doc(collection(db, 'vocabulary')).id;
        await setDoc(doc(db, 'vocabulary', id), {
          userId: user.uid,
          languageId: 'hindi',
          word: sw.word,
          translation: sw.translation,
          srsStage: 0,
          nextReviewDate: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      fetchVocabulary();
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'vocabulary');
    }
  };

  // Game Logic
  const startGame = () => {
    if (items.length < 3) return; // need some words to play
    
    // Select 6 random pairs
    const shuffled = [...items].sort(() => 0.5 - Math.random()).slice(0, 6);
    const cards: any[] = [];
    shuffled.forEach((item, index) => {
      cards.push({ id: `w_${index}`, text: item.word, matchId: index });
      cards.push({ id: `t_${index}`, text: item.translation, matchId: index });
    });
    
    setGameCards(cards.sort(() => 0.5 - Math.random()));
    setGameState('playing');
    setMatchedPairs(new Set());
    setSelectedCards([]);
    setScore(0);
    setTimeLeft(30);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setGameState('ended');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleCardClick = (index: number) => {
    if (gameState !== 'playing') return;
    if (selectedCards.includes(index) || matchedPairs.has(gameCards[index].matchId)) return;
    
    const newSelected = [...selectedCards, index];
    if (newSelected.length === 2) {
      const card1 = gameCards[newSelected[0]];
      const card2 = gameCards[newSelected[1]];
      
      if (card1.matchId === card2.matchId) {
        // Match!
        const newMatched = new Set(matchedPairs);
        newMatched.add(card1.matchId);
        setMatchedPairs(newMatched);
        setScore(s => s + 10);
        setSelectedCards([]);
        
        // Win condition
        if (newMatched.size === gameCards.length / 2) {
          clearInterval(timerRef.current);
          setGameState('ended');
          setScore(s => s + 50); // bonus
        }
      } else {
        // No match
        setSelectedCards(newSelected);
        setTimeout(() => setSelectedCards([]), 800);
      }
    } else {
      setSelectedCards(newSelected);
    }
  };

  // Pronunciation Logic
  const startPronunciationGame = () => {
    if (items.length < 3) return;
    const shuffled = [...items].sort(() => 0.5 - Math.random()).slice(0, 10);
    setPronunciationList(shuffled);
    setPronunciationIndex(0);
    setPronunciationScore(0);
    setPronunciationFeedback(null);
    setRecognizedText('');
    setPronunciationState('playing');
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    const currentWord = pronunciationList[pronunciationIndex];
    if (!currentWord) return;

    try {
      const recognition = new SpeechRecognition();
      // Use languageId if valid or a default
      recognition.lang = currentWord.languageId === 'spanish' ? 'es-ES' : 
                         currentWord.languageId === 'french' ? 'fr-FR' : 
                         currentWord.languageId === 'german' ? 'de-DE' : 
                         currentWord.languageId === 'italian' ? 'it-IT' : 
                         currentWord.languageId === 'japanese' ? 'ja-JP' : 
                         currentWord.languageId === 'korean' ? 'ko-KR' : 
                         currentWord.languageId === 'chinese' ? 'zh-CN' : 
                         'hi-IN'; // default to hindi

      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setRecognizedText('');
        setPronunciationFeedback(null);
      };

      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setRecognizedText(speechResult);
        
        const cleanTarget = currentWord.word.toLowerCase().replace(/[^\w\s\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]/gi, '').trim();
        const cleanSpeech = speechResult.toLowerCase().replace(/[^\w\s\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]/gi, '').trim();

        if (cleanSpeech.includes(cleanTarget) || cleanTarget.includes(cleanSpeech)) {
          setPronunciationFeedback('correct');
          setPronunciationScore(s => s + 10);
          setTimeout(() => {
            if (pronunciationIndex < pronunciationList.length - 1) {
              setPronunciationIndex(i => i + 1);
              setPronunciationFeedback(null);
              setRecognizedText('');
            } else {
              setPronunciationState('ended');
            }
          }, 1500);
        } else {
          setPronunciationFeedback('incorrect');
        }
      };

      recognition.onspeechend = () => {
        recognition.stop();
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        console.error("Speech recognition error:", event.error);
        if (event.error !== 'no-speech') {
          // Keep showing if it was just silence
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      alert("Failed to start speech recognition.");
      setIsListening(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading your reviews...</div>;

  const srsFinished = currentCardIndex >= dueItems.length;

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto w-full flex flex-col items-center">
      
      {/* Mode toggle */}
      <div className="w-full flex justify-center mb-8 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
        <button 
          onClick={() => setMode('srs')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center rounded-lg transition-all ${mode === 'srs' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Layers className="w-4 h-4 mr-2" /> srs
        </button>
        <button 
          onClick={() => setMode('game')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center rounded-lg transition-all ${mode === 'game' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Gamepad2 className="w-4 h-4 mr-2" /> game
        </button>
        <button 
          onClick={() => setMode('pronunciation')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center rounded-lg transition-all ${mode === 'pronunciation' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Mic className="w-4 h-4 mr-2" /> speaking
        </button>
      </div>

      {mode === 'srs' && (
        <div className="w-full flex flex-col items-center flex-1">
          <div className="w-full mb-6 font-bold flex justify-between items-center px-2">
            <span className="text-zinc-400">Daily Review</span>
            <span className="bg-zinc-800 px-3 py-1 rounded-full text-sm">{dueItems.length - currentCardIndex} Due</span>
          </div>

          {dueItems.length === 0 && !srsFinished && (
            <div className="text-center mt-12 flex flex-col items-center">
              <Layers className="w-24 h-24 text-zinc-800 mb-6" />
              <h2 className="text-xl font-bold mb-2 text-zinc-300">No words to review</h2>
              <p className="text-zinc-500 mb-8 max-w-xs">{items.length === 0 ? "You don't have any vocabulary yet." : "You've caught up with your vocabulary!"}</p>
              <Button onClick={seedSampleVocabulary} variant="outline" className="border-zinc-700 text-zinc-300">
                 Load Sample Words
              </Button>
            </div>
          )}

          {srsFinished && dueItems.length > 0 && (
            <div className="text-center mt-20">
              <CheckCircle2 className="w-24 h-24 text-green-500 mb-6 mx-auto" />
              <h2 className="text-2xl font-black text-green-400 mb-2">Review Complete!</h2>
              <p className="text-zinc-500">Come back later for your next spaced repetition session.</p>
            </div>
          )}

          {!srsFinished && dueItems.length > 0 && (
            <div className="w-full flex-1 flex flex-col justify-center">
              <div 
                className="relative w-full h-[300px] cursor-pointer"
                style={{ perspective: '1000px' }}
                onClick={() => !showAnswer && setShowAnswer(true)}
              >
                <motion.div
                  className="w-full h-full relative"
                  animate={{ rotateY: showAnswer ? 180 : 0 }}
                  transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front */}
                  <div 
                    className="absolute w-full h-full bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <h2 className="text-5xl font-black select-none text-white">{dueItems[currentCardIndex].word}</h2>
                    {!showAnswer && (
                      <p className="text-zinc-500 mt-8 text-sm font-bold animate-pulse uppercase tracking-wider">Tap to flip</p>
                    )}
                  </div>

                  {/* Back */}
                  <div 
                    className="absolute w-full h-full bg-zinc-800 border-2 border-zinc-700 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl"
                    style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                  >
                    <p className="text-4xl text-blue-400 font-black select-none">{dueItems[currentCardIndex].translation}</p>
                    <p className="text-zinc-500 mt-8 text-sm font-bold uppercase tracking-wider">Rate your memory</p>
                  </div>
                </motion.div>
              </div>

              {showAnswer && (
                <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
                   <div className="grid grid-cols-4 gap-2 w-full">
                      <button onClick={() => handleSrsAction('again')} className="py-4 flex flex-col items-center space-y-1 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-red-500/50 active:scale-95 transition-all"><span className="text-sm text-red-500 uppercase font-black mb-1">Again</span><span className="text-xs text-zinc-500 font-medium">&lt; 1m</span></button>
                      <button onClick={() => handleSrsAction('hard')} className="py-4 flex flex-col items-center space-y-1 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-orange-500/50 active:scale-95 transition-all"><span className="text-sm text-orange-500 uppercase font-black mb-1">Hard</span><span className="text-xs text-zinc-500 font-medium">1d</span></button>
                      <button onClick={() => handleSrsAction('good')} className="py-4 flex flex-col items-center space-y-1 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-green-500/50 active:scale-95 transition-all"><span className="text-sm text-green-500 uppercase font-black mb-1">Good</span><span className="text-xs text-zinc-500 font-medium">3d</span></button>
                      <button onClick={() => handleSrsAction('easy')} className="py-4 flex flex-col items-center space-y-1 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-blue-500/50 active:scale-95 transition-all"><span className="text-sm text-blue-500 uppercase font-black mb-1">Easy</span><span className="text-xs text-zinc-500 font-medium">7d</span></button>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'game' && (
        <div className="w-full flex-1 flex flex-col">
          {items.length < 3 ? (
            <div className="text-center mt-12 flex flex-col items-center">
              <Gamepad2 className="w-24 h-24 text-zinc-800 mb-6" />
              <h2 className="text-xl font-bold mb-2 text-zinc-300">Not enough words</h2>
              <p className="text-zinc-500 mb-8 max-w-xs">You need at least 3 vocabulary words to play the matching game.</p>
              <Button onClick={seedSampleVocabulary} variant="outline" className="border-zinc-700 text-zinc-300">
                 Load Sample Words
              </Button>
            </div>
          ) : gameState === 'idle' ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
               <div className="bg-blue-500/10 text-blue-400 p-4 rounded-full mb-6 relative">
                  <Timer className="w-12 h-12" />
                  <div className="absolute top-0 right-0 w-4 h-4 bg-blue-500 rounded-full animate-ping" />
               </div>
               <h2 className="text-3xl font-black text-white mb-2">Sprint Match</h2>
               <p className="text-zinc-400 mb-12 max-w-[250px]">Match as many translations as you can before the 30-second timer runs out!</p>
               
               <Button onClick={startGame} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-lg font-bold">
                 <Play className="w-6 h-6 mr-2 fill-current" /> Play Now
               </Button>
             </div>
          ) : (
            <div className="flex flex-col w-full">
              <div className="flex justify-between items-center mb-6 px-2">
                <div className="flex items-center text-zinc-300">
                  <Timer className={`w-5 h-5 mr-2 ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`} />
                  <span className={`font-mono text-xl font-bold ${timeLeft <= 10 ? 'text-red-400' : ''}`}>00:{timeLeft.toString().padStart(2, '0')}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-zinc-500 mr-2">SCORE</span>
                  <span className="font-mono text-xl font-bold text-yellow-400">{score}</span>
                </div>
              </div>

              {gameState === 'ended' ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-4 text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-2xl font-black text-white mb-2">Time's Up!</h3>
                  <p className="text-zinc-400 mb-8">You scored <strong className="text-yellow-400">{score}</strong> points.</p>
                  
                  <Button onClick={startGame} className="bg-blue-600 hover:bg-blue-700 text-white w-full rounded-full py-6 font-bold">
                    <RotateCcw className="w-5 h-5 mr-2" /> Play Again
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 w-full">
                  <AnimatePresence>
                    {gameCards.map((card, idx) => {
                      const isSelected = selectedCards.includes(idx);
                      const isMatched = matchedPairs.has(card.matchId);
                      
                      return (
                        <motion.button
                          key={card.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: isMatched ? 0 : 1, scale: isMatched ? 0.8 : 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          whileHover={{ scale: isMatched ? 0 : 1.02 }}
                          whileTap={{ scale: isMatched ? 0 : 0.98 }}
                          onClick={() => handleCardClick(idx)}
                          disabled={isMatched || selectedCards.length >= 2 && !isSelected}
                          className={`
                            p-4 min-h-[100px] flex items-center justify-center text-center rounded-2xl border-2 transition-colors font-bold text-lg pointer-events-auto
                            ${isSelected ? 'bg-blue-600/20 border-blue-500 text-blue-100' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'}
                          `}
                        >
                          {card.text}
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'pronunciation' && (
        <div className="w-full flex-1 flex flex-col">
          {items.length < 3 ? (
            <div className="text-center mt-12 flex flex-col items-center">
              <Mic className="w-24 h-24 text-zinc-800 mb-6" />
              <h2 className="text-xl font-bold mb-2 text-zinc-300">Not enough words</h2>
              <p className="text-zinc-500 mb-8 max-w-xs">You need at least 3 vocabulary words to practice pronunciation.</p>
              <Button onClick={seedSampleVocabulary} variant="outline" className="border-zinc-700 text-zinc-300">
                 Load Sample Words
              </Button>
            </div>
          ) : pronunciationState === 'idle' ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
               <div className="bg-red-500/10 text-red-400 p-4 rounded-full mb-6">
                  <Mic className="w-12 h-12" />
               </div>
               <h2 className="text-3xl font-black text-white mb-2">Speak & Learn</h2>
               <p className="text-zinc-400 mb-12 max-w-[250px]">Practice pronunciation of your vocabulary words. Speak clearly into your microphone!</p>
               
               <Button onClick={startPronunciationGame} className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-6 text-lg font-bold">
                 <Play className="w-6 h-6 mr-2 fill-current" /> Start Practice
               </Button>
             </div>
          ) : pronunciationState === 'ended' ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-4 text-center animate-in fade-in zoom-in-95 duration-500 flex-1 flex flex-col items-center justify-center">
              <div className="text-6xl mb-4 text-green-400">
                 <CheckCircle2 className="w-24 h-24 mx-auto" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Practice Complete!</h3>
              <p className="text-zinc-400 mb-8">You scored <strong className="text-red-400">{pronunciationScore}</strong> points.</p>
              
              <Button onClick={startPronunciationGame} className="bg-red-600 hover:bg-red-700 text-white w-full max-w-[200px] rounded-full py-6 font-bold">
                <RotateCcw className="w-5 h-5 mr-2" /> Play Again
              </Button>
            </div>
          ) : (
            <div className="flex flex-col w-full flex-1">
              <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest text-center w-full">Word {pronunciationIndex + 1} of {pronunciationList.length}</span>
              </div>
              
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-8 min-h-[300px] flex flex-col items-center justify-center text-center relative flex-1">
                  <h2 className="text-5xl font-black mb-8 select-none text-white">{pronunciationList[pronunciationIndex]?.word}</h2>
                  <p className="text-xl text-blue-400 font-bold mb-8">{pronunciationList[pronunciationIndex]?.translation}</p>

                  <div className="min-h-[60px] flex flex-col items-center justify-center">
                    {pronunciationFeedback === 'correct' && (
                      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center text-green-400 bg-green-500/10 px-4 py-2 rounded-full font-bold">
                        <CheckCircle2 className="w-5 h-5 mr-2" /> Perfect pronunciation!
                      </motion.div>
                    )}
                    {pronunciationFeedback === 'incorrect' && (
                      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center text-orange-400 bg-orange-500/10 px-4 py-2 rounded-full font-bold">
                        Almost there. Try again!
                      </motion.div>
                    )}
                    {recognizedText && pronunciationFeedback !== 'correct' && (
                       <p className="text-zinc-500 text-sm mt-2 italic">You said: "{recognizedText}"</p>
                    )}
                  </div>
                  
                  <button 
                    onClick={startListening}
                    disabled={isListening || pronunciationFeedback === 'correct'}
                    className={`mt-12 p-6 rounded-full transition-all flex items-center justify-center border-4
                      ${isListening ? 'bg-red-600 border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse' : 
                        pronunciationFeedback === 'correct' ? 'bg-zinc-800 border-zinc-700 text-zinc-600' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white hover:border-zinc-600 hover:scale-105 active:scale-95'
                      }
                    `}
                  >
                    <Mic className={`w-8 h-8 ${isListening ? 'text-white' : ''}`} />
                  </button>
                  <p className="mt-4 text-sm font-bold text-zinc-500 uppercase tracking-widest">{isListening ? 'Listening...' : pronunciationFeedback === 'correct' ? 'Next word...' : 'Tap to speak'}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

