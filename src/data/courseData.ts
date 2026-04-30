export type LessonType = 'vocabulary' | 'grammar' | 'pronunciation';

export interface LessonChallenge {
  id: string;
  type: 'translate_to_target' | 'translate_to_source' | 'matching' | 'multiple_choice' | 'pronunciation' | 'fill_in_the_blank';
  question: string;
  options?: string[];
  answer: string;
  speechLang?: string;
  pairs?: { [key: string]: string }; // For matching
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  xpReward: number;
  challenges: LessonChallenge[];
  vocabularyItems?: { word: string; translation: string; languageId: string }[];
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  language: string;
  flag: string;
  units: Unit[];
}

export const COURSES: Course[] = [
  {
    id: 'hindi_basics',
    title: 'Hindi',
    language: 'Hindi',
    flag: '🇮🇳',
    units: [
      {
        id: 'unit_1',
        title: 'Unit 1',
        description: 'Basics, Greetings',
        order: 1,
        lessons: [
          {
            id: 'lesson_1_1',
            title: 'Basic Greetings',
            type: 'vocabulary',
            xpReward: 10,
            vocabularyItems: [
              { word: 'Namaste', translation: 'Hello', languageId: 'hindi' },
              { word: 'Shukriya', translation: 'Thank you', languageId: 'hindi' },
              { word: 'Haan', translation: 'Yes', languageId: 'hindi' },
              { word: 'Nahi', translation: 'No', languageId: 'hindi' },
              { word: 'Alvida', translation: 'Goodbye', languageId: 'hindi' }
            ],
            challenges: [
              {
                id: 'c1',
                type: 'multiple_choice',
                question: 'How do you say "Hello"?',
                options: ['Namaste', 'Alvida', 'Shukriya', 'Haan'],
                answer: 'Namaste',
              },
              {
                id: 'c2',
                type: 'translate_to_source',
                question: 'Shukriya',
                options: ['Thank you', 'Hello', 'Goodbye', 'Please'],
                answer: 'Thank you',
              },
              {
                id: 'c3',
                type: 'multiple_choice',
                question: 'How do you say "Yes"?',
                options: ['Haan', 'Nahi', 'Shukriya', 'Alvida'],
                answer: 'Haan'
              }
            ]
          },
          {
            id: 'lesson_1_2',
            title: 'Pronouns',
            type: 'grammar',
            xpReward: 15,
            challenges: [
              {
                id: 'c4',
                type: 'multiple_choice',
                question: '"I am" translates to...',
                options: ['Main hoon', 'Tum ho', 'Vah hai', 'Hum hain'],
                answer: 'Main hoon',
              }
            ]
          }
        ]
      },
      {
        id: 'unit_2',
        title: 'Unit 2',
        description: 'Family, Food',
        order: 2,
        lessons: [
          {
            id: 'lesson_2_1',
            title: 'Family Members',
            type: 'vocabulary',
            xpReward: 10,
            challenges: [
              {
                id: 'c5',
                type: 'multiple_choice',
                question: '"Mother" translates to...',
                options: ['Maa', 'Pita', 'Bhai', 'Behen'],
                answer: 'Maa',
              }
            ]
          },
          {
            id: 'lesson_2_2',
            title: 'Pronunciation Basics',
            type: 'pronunciation',
            xpReward: 20,
            challenges: [
              {
                id: 'c6',
                type: 'pronunciation',
                question: 'Pronounce: Namaste',
                answer: 'Namaste',
                speechLang: 'hi-IN'
              },
              {
                id: 'c7',
                type: 'pronunciation',
                question: 'Pronounce: Shukriya (Thank You)',
                answer: 'Shukriya',
                speechLang: 'hi-IN'
              }
            ]
          },
          {
            id: 'lesson_2_3',
            title: 'Grammar: Verbs',
            type: 'grammar',
            xpReward: 15,
            challenges: [
              {
                id: 'c8',
                type: 'fill_in_the_blank',
                question: 'Main seb ___ hoon (I am eating an apple)',
                options: ['khata', 'peeta', 'sota'],
                answer: 'khata'
              },
              {
                id: 'c9',
                type: 'fill_in_the_blank',
                question: 'Vah pani ___ hai (He is drinking water)',
                options: ['peeta', 'khata', 'chalta'],
                answer: 'peeta'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'spanish_basics',
    title: 'Spanish',
    language: 'Spanish',
    flag: '🇪🇸',
    units: [
      {
        id: 'unit_1',
        title: 'Unit 1',
        description: 'Basics, Greetings',
        order: 1,
        lessons: [
          {
            id: 'lesson_1_1',
            title: 'Basic Greetings',
            type: 'vocabulary',
            xpReward: 10,
            challenges: [
              {
                id: 'c1',
                type: 'multiple_choice',
                question: 'How do you say "Hello"?',
                options: ['Hola', 'Adiós', 'Gracias', 'Sí'],
                answer: 'Hola',
              },
              {
                id: 'c2',
                type: 'translate_to_source',
                question: 'Gracias',
                options: ['Thank you', 'Hello', 'Goodbye', 'Please'],
                answer: 'Thank you',
              }
            ]
          },
          {
            id: 'lesson_1_2',
            title: 'Pronunciation Basics',
            type: 'pronunciation',
            xpReward: 15,
            challenges: [
              {
                id: 'c3',
                type: 'pronunciation',
                question: 'Pronounce: Hola',
                answer: 'Hola',
                speechLang: 'es-ES'
              }
            ]
          },
          {
            id: 'lesson_1_3',
            title: 'Basic Sentence Structure',
            type: 'grammar',
            xpReward: 15,
            challenges: [
              {
                id: 'c4',
                type: 'fill_in_the_blank',
                question: 'Yo ___ una manzana (I eat an apple)',
                options: ['como', 'bebo', 'duermo'],
                answer: 'como'
              }
            ]
          },
          {
            id: 'lesson_1_4',
            title: 'Common Phrases',
            type: 'pronunciation',
            xpReward: 20,
            challenges: [
              {
                id: 'c5',
                type: 'pronunciation',
                question: 'Pronounce: Buenos días (Good morning)',
                answer: 'Buenos días',
                speechLang: 'es-ES'
              },
              {
                id: 'c6',
                type: 'pronunciation',
                question: 'Pronounce: ¿Cómo estás? (How are you?)',
                answer: 'Cómo estás',
                speechLang: 'es-ES'
              },
              {
                id: 'c7',
                type: 'pronunciation',
                question: 'Pronounce: De nada (You are welcome)',
                answer: 'De nada',
                speechLang: 'es-ES'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'french_basics',
    title: 'French',
    language: 'French',
    flag: '🇫🇷',
    units: [
      {
        id: 'unit_1',
        title: 'Unit 1',
        description: 'Basics, Greetings',
        order: 1,
        lessons: [
          {
            id: 'lesson_1_1',
            title: 'Basic Greetings',
            type: 'vocabulary',
            xpReward: 10,
            challenges: [
              {
                id: 'c1',
                type: 'multiple_choice',
                question: 'How do you say "Hello"?',
                options: ['Bonjour', 'Au revoir', 'Merci', 'Oui'],
                answer: 'Bonjour',
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'japanese_basics',
    title: 'Japanese',
    language: 'Japanese',
    flag: '🇯🇵',
    units: [
      {
        id: 'unit_1',
        title: 'Unit 1',
        description: 'Basics, Greetings',
        order: 1,
        lessons: [
          {
            id: 'lesson_1_1',
            title: 'Basic Greetings',
            type: 'vocabulary',
            xpReward: 10,
            challenges: [
              {
                id: 'c1',
                type: 'multiple_choice',
                question: 'How do you say "Hello"?',
                options: ['Konnichiwa', 'Sayonara', 'Arigato', 'Hai'],
                answer: 'Konnichiwa',
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'german_basics',
    title: 'German',
    language: 'German',
    flag: '🇩🇪',
    units: [
      {
        id: 'unit_1',
        title: 'Unit 1',
        description: 'Basics, Greetings',
        order: 1,
        lessons: [
          {
            id: 'lesson_1_1',
            title: 'Basic Greetings',
            type: 'vocabulary',
            xpReward: 10,
            challenges: [
              {
                id: 'c1',
                type: 'multiple_choice',
                question: 'How do you say "Hello"?',
                options: ['Hallo', 'Tschüss', 'Danke', 'Bitte'],
                answer: 'Hallo',
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'italian_basics',
    title: 'Italian',
    language: 'Italian',
    flag: '🇮🇹',
    units: [
      {
        id: 'unit_1',
        title: 'Unit 1',
        description: 'Basics, Greetings',
        order: 1,
        lessons: [
          {
            id: 'lesson_1_1',
            title: 'Basic Greetings',
            type: 'vocabulary',
            xpReward: 10,
            challenges: [
              {
                id: 'c1',
                type: 'multiple_choice',
                question: 'How do you say "Hello"?',
                options: ['Ciao', 'Arrivederci', 'Grazie', 'Prego'],
                answer: 'Ciao',
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'korean_basics',
    title: 'Korean',
    language: 'Korean',
    flag: '🇰🇷',
    units: [
      {
        id: 'unit_1',
        title: 'Unit 1',
        description: 'Basics, Greetings',
        order: 1,
        lessons: [
          {
            id: 'lesson_1_1',
            title: 'Basic Greetings',
            type: 'vocabulary',
            xpReward: 10,
            challenges: [
              {
                id: 'c1',
                type: 'multiple_choice',
                question: 'How do you say "Hello"?',
                options: ['Annyeonghaseyo', 'Gamsahamnida', 'Ne', 'Aniyo'],
                answer: 'Annyeonghaseyo',
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'chinese_basics',
    title: 'Chinese',
    language: 'Chinese (Mandarin)',
    flag: '🇨🇳',
    units: [
      {
        id: 'unit_1',
        title: 'Unit 1',
        description: 'Basics, Greetings',
        order: 1,
        lessons: [
          {
            id: 'lesson_1_1',
            title: 'Basic Greetings',
            type: 'vocabulary',
            xpReward: 10,
            challenges: [
              {
                id: 'c1',
                type: 'multiple_choice',
                question: 'How do you say "Hello"?',
                options: ['Nǐ hǎo', 'Xièxiè', 'Zàijiàn', 'Shì'],
                answer: 'Nǐ hǎo',
              }
            ]
          }
        ]
      }
    ]
  }
];

export const SAMPLE_COURSE: Course = COURSES[0];
