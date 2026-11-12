// Ethiopian Sign Language (EthSL) Comprehensive Dataset
// Sourced directly from "Ethiopian Sign Language Useful Words & Phrases" & "Alphabet Reference Sheet"
// Video Reference: https://youtu.be/c636uSx0o7g

export interface EthslSignItem {
  id: string;
  english: string;
  amharic: string;
  phonetic: string;
  category: 
    | 'greetings' 
    | 'courtesy' 
    | 'food_drink' 
    | 'questions' 
    | 'family' 
    | 'emotions' 
    | 'education_work' 
    | 'transport' 
    | 'colors' 
    | 'numbers_days' 
    | 'conversation';
  categoryLabel: string;
  handshapeDescription: string;
  aslComparison: string;
  handsCount: 1 | 2;
  pageNumber: number;
  emoji: string;
  tips?: string;
}

export interface EthslFidelConsonant {
  letterId: string;
  fidel: string;
  romanization: string;
  handshapeDescription: string;
  aslEquivalent: string;
  pageNumber: number;
}

export interface EthslVowelRule {
  order: number;
  vowelSound: string;
  sampleFidel: string;
  motionDescription: string;
  aslComparison: string;
  pageNumber: number;
}

// -----------------------------------------------------------------------------
// Part 1: All EthSL Words & Phrases from the PDF (Pages 1-49)
// -----------------------------------------------------------------------------
export const ETHSL_PDF_SIGNS: EthslSignItem[] = [
  // Page 1
  {
    id: 'hello_selam',
    english: 'Hello / Peace',
    amharic: 'ሰላም',
    phonetic: 'Selam',
    category: 'greetings',
    categoryLabel: 'Greetings & National',
    handshapeDescription: "Both hands start in '5' handshape with fingers on shoulders, palms facing toward shoulders. Hands move away from body to 's'-handshapes at shoulder height, palms still facing shoulders.",
    aslComparison: 'Same sign as "health"',
    handsCount: 2,
    pageNumber: 1,
    emoji: '👋',
    tips: 'Right hand can be interchanged for dominant hand.'
  },
  {
    id: 'exhabier_yemesgen',
    english: 'Thanks be to God',
    amharic: 'እግዚአብሔር ይመስገን',
    phonetic: 'Egziabher Yemesgen',
    category: 'greetings',
    categoryLabel: 'Greetings & National',
    handshapeDescription: "God: Left arm across in front of stomach, hand flat with fingers together. Right arm: elbow on top of left hand, making a right angle. Hand is flat with fingers together. Thank you: Right hand starts with fingers touching chin, palm facing the body. Left hand starts about 6 inches in front of stomach, palm facing toward chin. Right hand moves from chin to left hand.",
    aslComparison: 'Most similar to "tree good" except tree is signed with fingers together and no movement.',
    handsCount: 2,
    pageNumber: 1,
    emoji: '🙏',
    tips: 'Standard response to "Selam".'
  },

  // Page 2 - 3
  {
    id: 'welcome_enquan',
    english: 'Welcome',
    amharic: 'እንኳን ደህና መጣችሁ',
    phonetic: 'Enquan Dehena Metachu',
    category: 'greetings',
    categoryLabel: 'Greetings & National',
    handshapeDescription: "Signed in 3 parts: 1) Enquan: Right pointer finger touches cheek, wrist turns front to back. 2) Dehena (Selam): Hands on shoulders moving away to 's' shapes. 3) Metachu: Both hands in '1' handshapes move in circles toward the chest.",
    aslComparison: 'Same as "candy health sign" followed by movement to chest',
    handsCount: 2,
    pageNumber: 2,
    emoji: '🤝'
  },
  {
    id: 'ethiopia',
    english: 'Ethiopia',
    amharic: 'ኢትዮጵያ',
    phonetic: 'Ityopya',
    category: 'greetings',
    categoryLabel: 'Greetings & National',
    handshapeDescription: "'a' handshape, start with right hand in front of forehead with thumb facing forehead. Move toward left ear to begin making a circle around the face. After a complete circle, the right hand stops in front of the nose.",
    aslComparison: '"Hawaii" signed with an \'a\' handshape',
    handsCount: 1,
    pageNumber: 3,
    emoji: '🇪🇹'
  },

  // Page 4 - 5
  {
    id: 'deaf',
    english: 'Deaf',
    amharic: 'ደንቆሮ / መስማት የተሳነው',
    phonetic: 'Denqoro / Des-Yetesanew',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "'u' handshape, right hand touches just in front of right ear and then just to the right of the lips.",
    aslComparison: "Deaf signed with 'u' handshape",
    handsCount: 1,
    pageNumber: 4,
    emoji: '🧏'
  },
  {
    id: 'hard_of_hearing',
    english: 'Hard-of-hearing',
    amharic: 'መስማት የሚከብደው',
    phonetic: 'Mesmat Yemikebdew',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "Fingers together, fingers at right angle to palm. Signed next to ear, palm facing ear. Turning wrist slightly back and forward.",
    aslComparison: 'Height of a person as tall as your ear',
    handsCount: 1,
    pageNumber: 4,
    emoji: '👂'
  },
  {
    id: 'hearing',
    english: 'Hearing',
    amharic: 'የሚሰማ',
    phonetic: 'Yemisema',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "Hand in 'c' handshape starting on ear and moving outward a few inches.",
    aslComparison: 'Similar to "radio"',
    handsCount: 1,
    pageNumber: 4,
    emoji: '📻'
  },
  {
    id: 'amharic_lang',
    english: 'Amharic',
    amharic: 'አማርኛ',
    phonetic: 'Amarigna',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "Opened '5' handshape facing neck brought outward to flattened 'o' handshape, repeat once.",
    aslComparison: '"White" signed at the throat twice',
    handsCount: 1,
    pageNumber: 5,
    emoji: '🗣️'
  },
  {
    id: 'culture',
    english: 'Culture',
    amharic: 'ባህል',
    phonetic: 'Bahil',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "Ethiopian 'b' handshape moving in small circle near the forehead.",
    aslComparison: 'Similar to the sign for "uncle"',
    handsCount: 1,
    pageNumber: 5,
    emoji: '🏛️'
  },

  // Page 6 - 7
  {
    id: 'ethiopian_sign_language',
    english: 'Ethiopian Sign Language',
    amharic: 'የኢትዮጵያ የምልክት ቋንቋ',
    phonetic: 'Ye-Ityopya Ye-Milikit Qwanqwa',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "Signed in 3 parts: 1) Ethiopian: circle around face with 'a' handshape. 2) Sign: '5' handshape - both hands move in circular motions facing each other in front of chest, moving away from chest. 3) Language: 'L' handshape - both hands move in circular motions facing each other in front of chest, moving toward chest.",
    aslComparison: 'Same word order as "American Sign Language"',
    handsCount: 2,
    pageNumber: 6,
    emoji: '👐'
  },
  {
    id: 'language_spoken',
    english: 'Language (spoken)',
    amharic: 'ቋንቋ',
    phonetic: 'Qwanqwa',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "'1' handshape starts in front of lips and bounces while moving outward, palm faces body.",
    aslComparison: 'ASL sign for "hearing" moving away from the body',
    handsCount: 1,
    pageNumber: 6,
    emoji: '💬'
  },
  {
    id: 'speech',
    english: 'Speech',
    amharic: 'ንግግር',
    phonetic: 'Nigigir',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "Bent 'v' handshape moving in circular motion near lips, palm facing lips.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 7,
    emoji: '🎙️'
  },
  {
    id: 'bathroom',
    english: 'Bathroom',
    amharic: 'መታጠቢያ ቤት / ሽንት ቤት',
    phonetic: 'Metatebiya Bet',
    category: 'transport',
    categoryLabel: 'Places & Facilities',
    handshapeDescription: "'t' handshape shaking left and right, palm facing away from body.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 7,
    emoji: '🚻'
  },
  {
    id: 'excuse_me',
    english: 'Excuse me',
    amharic: 'ይቅርታ',
    phonetic: 'Yiqirta',
    category: 'courtesy',
    categoryLabel: 'Courtesy & Politeness',
    handshapeDescription: "Both hands flat, right hand on top, swipes left hand in outward motion. Left palm faces up, right palm faces down. Repeat once.",
    aslComparison: 'Similar to ASL, except signed with both hands flat',
    handsCount: 2,
    pageNumber: 7,
    emoji: '🙇'
  },

  // Page 8 - 10
  {
    id: 'please_ethsl',
    english: 'Please',
    amharic: 'እባክዎ / እባክህ',
    phonetic: 'Ebakwo / Ebakih',
    category: 'courtesy',
    categoryLabel: 'Courtesy & Politeness',
    handshapeDescription: "Flat hand on chest moving in circular motion.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 8,
    emoji: '🤲'
  },
  {
    id: 'sorry_ethsl',
    english: 'Sorry',
    amharic: 'ይቅርታ / አዝናለሁ',
    phonetic: 'Azinalehu',
    category: 'courtesy',
    categoryLabel: 'Courtesy & Politeness',
    handshapeDescription: "'a' handshape on chest moving in circular motion, palm facing chest.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 8,
    emoji: '🙏'
  },
  {
    id: 'thank_you_ethsl',
    english: 'Thank you',
    amharic: 'አመሰግናለሁ',
    phonetic: 'Ameseginalehu',
    category: 'courtesy',
    categoryLabel: 'Courtesy & Politeness',
    handshapeDescription: "Right hand flat at chin moving away until it meets the left hand a few inches away, palms facing chin. Bend forward slightly while signing.",
    aslComparison: 'ASL sign for "good"',
    handsCount: 2,
    pageNumber: 8,
    emoji: '✨'
  },
  {
    id: 'no_worries',
    english: "No worries / You're welcome",
    amharic: 'ችግር የለም',
    phonetic: 'Chigir Yelem',
    category: 'courtesy',
    categoryLabel: 'Courtesy & Politeness',
    handshapeDescription: "Chigir: Both hands in 'b' handshapes moving in small circular motion towards chin with palms facing away from body. Yelem: Hands start in 'f' handshape and move into '5' handshape with slight outward movement, palms facing away.",
    aslComparison: 'Chigir is ASL "worry" near chin; Yelem starts in "f" and opens to "5".',
    handsCount: 2,
    pageNumber: 9,
    emoji: '😊'
  },
  {
    id: 'good_ethsl',
    english: 'Good',
    amharic: 'ጥሩ / ደህና',
    phonetic: 'Tiru / Dehena',
    category: 'courtesy',
    categoryLabel: 'Courtesy & Politeness',
    handshapeDescription: "Flat hand at chin moving away, palm facing chin.",
    aslComparison: 'ASL sign for "thank you"',
    handsCount: 1,
    pageNumber: 10,
    emoji: '👍'
  },
  {
    id: 'need_ethsl',
    english: 'Need',
    amharic: 'ያስፈልጋል',
    phonetic: 'Yasfeligal',
    category: 'questions',
    categoryLabel: 'Questions & Needs',
    handshapeDescription: "'x' handshape moving up and down.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 10,
    emoji: '⚠️'
  },

  // Page 11 - 13
  {
    id: 'want_ethsl',
    english: 'Want',
    amharic: 'እፈልጋለሁ',
    phonetic: 'Efeligalehu',
    category: 'questions',
    categoryLabel: 'Questions & Needs',
    handshapeDescription: "Both hands in claw handshapes, palms facing up, bring both hands toward you.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 11,
    emoji: '🤲'
  },
  {
    id: 'who_ethsl',
    english: 'Who',
    amharic: 'ማን',
    phonetic: 'Man',
    category: 'questions',
    categoryLabel: 'Questions & Needs',
    handshapeDescription: "'1' handshape moves in circle around lips.",
    aslComparison: 'Same as ASL "lips"',
    handsCount: 1,
    pageNumber: 11,
    emoji: '❓'
  },
  {
    id: 'what_ethsl',
    english: 'What',
    amharic: 'ምን',
    phonetic: 'Min',
    category: 'questions',
    categoryLabel: 'Questions & Needs',
    handshapeDescription: "'1' handshape shakes left and right.",
    aslComparison: 'Same as ASL "where"',
    handsCount: 1,
    pageNumber: 11,
    emoji: '🤔'
  },
  {
    id: 'where_ethsl',
    english: 'Where',
    amharic: 'የት',
    phonetic: 'Yet',
    category: 'questions',
    categoryLabel: 'Questions & Needs',
    handshapeDescription: "Both hands in '5' handshapes, moving left and right with palms facing up.",
    aslComparison: 'Same as ASL "what"',
    handsCount: 2,
    pageNumber: 12,
    emoji: '🗺️'
  },
  {
    id: 'when_ethsl',
    english: 'When',
    amharic: 'መቼ',
    phonetic: 'Meche',
    category: 'questions',
    categoryLabel: 'Questions & Needs',
    handshapeDescription: "'1' handshapes start with palms facing up and turn inward so palms are facing down.",
    aslComparison: 'Same as ASL "happen"',
    handsCount: 2,
    pageNumber: 12,
    emoji: '⏰'
  },
  {
    id: 'why_ethsl',
    english: 'Why',
    amharic: 'ለምን',
    phonetic: 'Lemin',
    category: 'questions',
    categoryLabel: 'Questions & Needs',
    handshapeDescription: "Hand starts flat touching forehead, moves downward into 'y' handshape with palm facing in.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 12,
    emoji: '💡'
  },
  {
    id: 'how_ethsl',
    english: 'How',
    amharic: 'እንዴት',
    phonetic: 'Endet',
    category: 'questions',
    categoryLabel: 'Questions & Needs',
    handshapeDescription: "Both hands bent with fingers together, start with hands touching at fingers. Hands turn and move away from each other slightly.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 13,
    emoji: '🧩'
  },
  {
    id: 'interested',
    english: 'Interested',
    amharic: 'ፍላጎት',
    phonetic: 'Filagot',
    category: 'emotions',
    categoryLabel: 'Emotions & State',
    handshapeDescription: "Both hands flat, rub palms together vigorously.",
    aslComparison: 'ASL sign for "motivated"',
    handsCount: 2,
    pageNumber: 13,
    emoji: '🔥'
  },

  // Page 14 - 17
  {
    id: 'sick',
    english: 'Sick',
    amharic: 'ህመምተኛ / ታሟል',
    phonetic: 'Himemtenga',
    category: 'emotions',
    categoryLabel: 'Emotions & State',
    handshapeDescription: "Turn middle finger on forehead.",
    aslComparison: 'Similar to ASL sign for "sick of"',
    handsCount: 1,
    pageNumber: 14,
    emoji: '🤒'
  },
  {
    id: 'family',
    english: 'Family',
    amharic: 'ቤተሰብ',
    phonetic: 'Beteseb',
    category: 'family',
    categoryLabel: 'Family & People',
    handshapeDescription: "Both hands in Ethiopian 'b' handshapes. Hands start next to each other near body with palms facing out, separate and move in a circle, ending next to each other away from body with palms facing in.",
    aslComparison: 'Same motion as ASL family using Ethiopian "b" handshapes',
    handsCount: 2,
    pageNumber: 14,
    emoji: '👨‍👩‍👧‍👦'
  },
  {
    id: 'mother',
    english: 'Mother',
    amharic: 'እናት',
    phonetic: 'Enat',
    category: 'family',
    categoryLabel: 'Family & People',
    handshapeDescription: "'5' handshape, thumb touching chin, palm facing down, with fingers wiggling.",
    aslComparison: 'Signs similar to ASL at chin',
    handsCount: 1,
    pageNumber: 14,
    emoji: '👩'
  },
  {
    id: 'father',
    english: 'Father',
    amharic: 'አባት',
    phonetic: 'Abat',
    category: 'family',
    categoryLabel: 'Family & People',
    handshapeDescription: "'5' handshape, thumb touching forehead, palm facing down, with fingers wiggling.",
    aslComparison: 'Signs similar to ASL at forehead',
    handsCount: 1,
    pageNumber: 15,
    emoji: '👨'
  },
  {
    id: 'girl',
    english: 'Girl',
    amharic: 'ሴት ልጅ',
    phonetic: 'Set Lij',
    category: 'family',
    categoryLabel: 'Family & People',
    handshapeDescription: "'a' handshape making a small line on the chin, repeat once.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 15,
    emoji: '👧'
  },
  {
    id: 'boy',
    english: 'Boy',
    amharic: 'ወንድ ልጅ',
    phonetic: 'Wend Lij',
    category: 'family',
    categoryLabel: 'Family & People',
    handshapeDescription: "'a' handshape making a small line on the temple, repeat once.",
    aslComparison: 'ASL sign for "girl" signed at forehead',
    handsCount: 1,
    pageNumber: 15,
    emoji: '👦'
  },
  {
    id: 'sister',
    english: 'Sister',
    amharic: 'እህት',
    phonetic: 'Ehit',
    category: 'family',
    categoryLabel: 'Family & People',
    handshapeDescription: "Right hand in 'a' handshape touches side of chin with thumb, then both hands in '1' handshapes next to each other in front of chest, palms facing down.",
    aslComparison: 'Similar to "girl same"',
    handsCount: 2,
    pageNumber: 15,
    emoji: '👭'
  },
  {
    id: 'brother',
    english: 'Brother',
    amharic: 'ወንድም',
    phonetic: 'Wendim',
    category: 'family',
    categoryLabel: 'Family & People',
    handshapeDescription: "Right hand in 'a' handshape touches temple with thumb, then both hands in '1' handshapes next to each other in front of chest, palms facing down.",
    aslComparison: 'Similar to "boy same"',
    handsCount: 2,
    pageNumber: 16,
    emoji: '👬'
  },
  {
    id: 'woman',
    english: 'Woman',
    amharic: 'ሴት',
    phonetic: 'Set',
    category: 'family',
    categoryLabel: 'Family & People',
    handshapeDescription: "Right hand in 'a' handshape touches side of chin with thumb, then right hand in '5' handshape touches chest with thumb, palm facing left.",
    aslComparison: 'Similar to "girl fine"',
    handsCount: 1,
    pageNumber: 16,
    emoji: '👩‍💼'
  },
  {
    id: 'man',
    english: 'Man',
    amharic: 'ወንድ',
    phonetic: 'Wend',
    category: 'family',
    categoryLabel: 'Family & People',
    handshapeDescription: "Right hand in 'a' handshape touches temple with thumb, then right hand in '5' handshape touches chest with thumb, palm facing left.",
    aslComparison: 'Similar to "boy fine"',
    handsCount: 1,
    pageNumber: 17,
    emoji: '👨‍💼'
  },
  {
    id: 'baby',
    english: 'Baby',
    amharic: 'ህፃን',
    phonetic: 'Hitsan',
    category: 'family',
    categoryLabel: 'Family & People',
    handshapeDescription: "Both hands flat, right hand on top of left hand, palms facing up, hands start in front of chest and arms make rocking motion left and right.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 17,
    emoji: '👶'
  },
  {
    id: 'friend',
    english: 'Friend',
    amharic: 'ጓደኛ',
    phonetic: 'Gwadegna',
    category: 'family',
    categoryLabel: 'Family & People',
    handshapeDescription: "Both hands in '1' handshapes, palms facing opposite directions, hands touch at tips of pointer fingers first with right hand on top, then with left hand on top.",
    aslComparison: 'Similar to ASL friend, but uses straight pointer fingers instead of bent',
    handsCount: 2,
    pageNumber: 18,
    emoji: '🤝'
  },
  {
    id: 'more',
    english: 'More',
    amharic: 'ተጨማሪ',
    phonetic: 'Techamari',
    category: 'questions',
    categoryLabel: 'Questions & Needs',
    handshapeDescription: "Both hands in flattened 'o' handshapes, left hand starts in front of body with palm facing up, right comes and lands on top with palm facing down.",
    aslComparison: 'Similar to ASL sign except palm orientations are up and down instead of left and right',
    handsCount: 2,
    pageNumber: 18,
    emoji: '➕'
  },

  // Page 19 - 21
  {
    id: 'wrong',
    english: 'Wrong',
    amharic: 'ስህተት',
    phonetic: 'Sihtet',
    category: 'emotions',
    categoryLabel: 'Emotions & State',
    handshapeDescription: "'y' handshape, knuckles tap chin, palm facing chin.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 19,
    emoji: '❌'
  },
  {
    id: 'right_correct',
    english: 'Right / Correct',
    amharic: 'ትክክል',
    phonetic: 'Tikkikkil',
    category: 'courtesy',
    categoryLabel: 'Courtesy & Politeness',
    handshapeDescription: "Both hands in '1' handshapes, palms facing opposite directions, right hand lands on top of left hand, signed in front of chest.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 19,
    emoji: '✅'
  },
  {
    id: 'gobez',
    english: 'Smart / Clever',
    amharic: 'ጎበዝ',
    phonetic: 'Gobez',
    category: 'emotions',
    categoryLabel: 'Emotions & State',
    handshapeDescription: "Hand starts in '1' handshape touching forehead, moves slightly down into 'x' handshape, palm facing left.",
    aslComparison: 'Similar handshapes to interesting, signed at forehead',
    handsCount: 1,
    pageNumber: 19,
    emoji: '🧠'
  },
  {
    id: 'play_feel_free',
    english: 'Play / Feel free',
    amharic: 'መጫወት',
    phonetic: 'Meqawet',
    category: 'education_work',
    categoryLabel: 'Activities & School',
    handshapeDescription: "Both hands in 'y' handshapes, palms facing the body, shake up and down.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 20,
    emoji: '🎮'
  },
  {
    id: 'school',
    english: 'School',
    amharic: 'ትምህርት ቤት',
    phonetic: 'Timhirt Bet',
    category: 'education_work',
    categoryLabel: 'Activities & School',
    handshapeDescription: "Both hands in '5' handshapes, left palm facing up, right palm facing down, clap right palm on left palm.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 20,
    emoji: '🏫'
  },
  {
    id: 'home',
    english: 'Home',
    amharic: 'ቤት',
    phonetic: 'Bet',
    category: 'transport',
    categoryLabel: 'Places & Facilities',
    handshapeDescription: "Flattened 'o' handshape, fingertips touch on cheek close to lips and then move to touch closer to ear on right side of face.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 20,
    emoji: '🏠'
  },
  {
    id: 'help_ethsl_twohand',
    english: 'Help',
    amharic: 'እርዳኝ / እርዳታ',
    phonetic: 'Eredagn',
    category: 'courtesy',
    categoryLabel: 'Courtesy & Politeness',
    handshapeDescription: "Left hand flat, palm facing up, right hand in 'a' handshape, palm facing left, right hand resting on left, both hands move up.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 21,
    emoji: '🆘'
  },
  {
    id: 'food',
    english: 'Food',
    amharic: 'ምግብ',
    phonetic: 'Migib',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "Both hands in flattened 'o' handshapes, right hand above left hand, shaking slightly in front of lips.",
    aslComparison: 'Same as ASL, uses two hands',
    handsCount: 2,
    pageNumber: 21,
    emoji: '🍲'
  },
  {
    id: 'eat',
    english: 'Eat',
    amharic: 'መብላት',
    phonetic: 'Meblat',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "One hand in flattened 'o' handshape, moves toward the lips like putting food in your mouth.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 21,
    emoji: '🍽️'
  },
  {
    id: 'fruit',
    english: 'Fruit',
    amharic: 'ፍራፍሬ',
    phonetic: 'Firafrē',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "Both hands in Ethiopian 'f' handshapes, start with pointer fingers touching and palms facing each other, move apart and turn so both palms are facing down.",
    aslComparison: 'Similar to ASL sign for "eggs"',
    handsCount: 2,
    pageNumber: 21,
    emoji: '🍎'
  },

  // Page 22 - 25
  {
    id: 'meat',
    english: 'Meat',
    amharic: 'ስጋ',
    phonetic: 'Siga',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "Left hand in '5' handshape, palm facing body, right hand flat, palm facing up. Right hand sits between middle and ring fingers and moves back and forth towards and away from body.",
    aslComparison: 'Similar to ASL sign for "break"',
    handsCount: 2,
    pageNumber: 22,
    emoji: '🥩'
  },
  {
    id: 'vegetables',
    english: 'Vegetables',
    amharic: 'አትክልት',
    phonetic: 'Atkilt',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "Hand begins in 's' handshape, palm facing body with fingers on bottom. 's' drops into '4' handshape, fingers still pointing down with palm facing in.",
    aslComparison: 'Signing "many" upside down',
    handsCount: 1,
    pageNumber: 22,
    emoji: '🥗'
  },
  {
    id: 'water_ethsl',
    english: 'Water',
    amharic: 'ውሃ',
    phonetic: 'Wuha',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "Ethiopian 'w' handshape at chin, palm facing in.",
    aslComparison: 'Same location as ASL (ASL sign is also recognized in Ethiopia)',
    handsCount: 1,
    pageNumber: 23,
    emoji: '💧'
  },
  {
    id: 'thirsty',
    english: 'Thirsty',
    amharic: 'ውሃ ጠማኝ',
    phonetic: 'Wuha Temagn',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "'1' handshape touches chin and slides down throat, palm facing in.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 23,
    emoji: '🥤'
  },
  {
    id: 'drink',
    english: 'Drink',
    amharic: 'መጠጣት',
    phonetic: 'Metetat',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "'C' handshape, moves like you are holding a cup and drinking.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 23,
    emoji: '🥛'
  },
  {
    id: 'injera',
    english: 'Injera (Ethiopian bread)',
    amharic: 'እንጀራ',
    phonetic: 'Injera',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "'a' handshape with thumb down, moves in a circle horizontally.",
    aslComparison: 'Similar to ASL sign for "sauce"',
    handsCount: 1,
    pageNumber: 23,
    emoji: '🫓'
  },
  {
    id: 'bread_dabo',
    english: 'Bread',
    amharic: 'ዳቦ',
    phonetic: 'Dabo',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "Both hands in 'a' handshapes, start next to each other, palms facing out and moves apart while turning so palms are facing each other.",
    aslComparison: 'Sign for "break" with \'a\' handshape',
    handsCount: 2,
    pageNumber: 24,
    emoji: '🍞'
  },
  {
    id: 'tea_shay',
    english: 'Tea',
    amharic: 'ሻይ',
    phonetic: 'Shay',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "Left hand in 'o' handshape, palm facing right. Right hand in 'f' handshape with pointer finger/thumb moving like stirring a spoon in a cup over left hand.",
    aslComparison: 'Combination of handshapes for "tea" and motion for "coffee"',
    handsCount: 2,
    pageNumber: 24,
    emoji: '☕'
  },
  {
    id: 'coffee_buna',
    english: 'Coffee',
    amharic: 'ቡና',
    phonetic: 'Buna',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "Both hands in 's' handshapes, left hand sits in front of chest with palm facing right. Right hand starts above, moving down to hit the left hand, then both make a grinding motion.",
    aslComparison: 'Similar to ASL sign for "make"',
    handsCount: 2,
    pageNumber: 25,
    emoji: '☕'
  },
  {
    id: 'sugar_sikwar',
    english: 'Sugar',
    amharic: 'ስኳር',
    phonetic: 'Sikwar',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "Right hand flat and bending slightly, brushing the chin with your fingertips downward.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 25,
    emoji: '🧂'
  },
  {
    id: 'hungry',
    english: 'Hungry',
    amharic: 'ተርቦኛል',
    phonetic: 'Terbognall',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "Bent hand with fingers together slicing body in half at gut level, palm facing in.",
    aslComparison: 'Looks like cutting your body in half',
    handsCount: 1,
    pageNumber: 26,
    emoji: '😋'
  },

  // Meals
  {
    id: 'breakfast',
    english: 'Breakfast',
    amharic: 'ቁርስ',
    phonetic: 'Qurs',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "Ethiopian 'q' handshape touching at chin.",
    aslComparison: 'Same motion and location as ASL sign',
    handsCount: 1,
    pageNumber: 26,
    emoji: '🥞'
  },
  {
    id: 'lunch',
    english: 'Lunch',
    amharic: 'ምሳ',
    phonetic: 'Misa',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "Ethiopian 'm' handshape touching at chin.",
    aslComparison: 'Same motion and location as ASL sign',
    handsCount: 1,
    pageNumber: 26,
    emoji: '🥪'
  },
  {
    id: 'dinner',
    english: 'Dinner',
    amharic: 'እራት',
    phonetic: 'Erat',
    category: 'food_drink',
    categoryLabel: 'Food & Drink',
    handshapeDescription: "Ethiopian 'r' handshape touching at chin.",
    aslComparison: 'Looks similar to lunch',
    handsCount: 1,
    pageNumber: 27,
    emoji: '🍲'
  },

  // Page 27 - 29
  {
    id: 'line_up',
    english: 'Line up',
    amharic: 'ተሰለፉ',
    phonetic: 'Teselefu',
    category: 'education_work',
    categoryLabel: 'Activities & School',
    handshapeDescription: "Both hands in '5' handshapes, palms facing opposite directions, start with hands next to each other and move apart, fingertips facing up.",
    aslComparison: "Similar to ASL, uses '5' handshape",
    handsCount: 2,
    pageNumber: 27,
    emoji: '🧍‍♂️🧍‍♀️'
  },
  {
    id: 'watch_attention',
    english: 'Watch / Pay attention',
    amharic: 'ተመልከቱ / አዳምጡ',
    phonetic: 'Temelketu',
    category: 'education_work',
    categoryLabel: 'Activities & School',
    handshapeDescription: "Both hands in '2' handshapes with fingers facing away from body, then moving to face toward eyes.",
    aslComparison: 'ASL sign for "look at me"',
    handsCount: 2,
    pageNumber: 27,
    emoji: '👀'
  },
  {
    id: 'listen',
    english: 'Listen',
    amharic: 'አዳምጥ',
    phonetic: 'Adamit',
    category: 'education_work',
    categoryLabel: 'Activities & School',
    handshapeDescription: "'C' handshape around the back of your ear, lean in slightly.",
    aslComparison: 'Looks similar to a large hearing aid on ear',
    handsCount: 1,
    pageNumber: 28,
    emoji: '👂'
  },
  {
    id: 'happy',
    english: 'Happy',
    amharic: 'ደስተኛ',
    phonetic: 'Destegna',
    category: 'emotions',
    categoryLabel: 'Emotions & State',
    handshapeDescription: "Both hands flat, touching chest while moving upward.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 28,
    emoji: '😄'
  },
  {
    id: 'sad',
    english: 'Sad',
    amharic: 'አዝኗል',
    phonetic: 'Azinwal',
    category: 'emotions',
    categoryLabel: 'Emotions & State',
    handshapeDescription: "Both hands in '5' handshapes, palms facing face, start with hands near eyes and move down.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 28,
    emoji: '😢'
  },
  {
    id: 'angry',
    english: 'Angry',
    amharic: 'ተናድጃል',
    phonetic: 'Tenadjall',
    category: 'emotions',
    categoryLabel: 'Emotions & State',
    handshapeDescription: "'e' handshape at the mouth, opening and closing slightly, palm facing in.",
    aslComparison: 'ASL sign for grumpy, signed at mouth',
    handsCount: 1,
    pageNumber: 29,
    emoji: '😠'
  },
  {
    id: 'tired',
    english: 'Tired',
    amharic: 'ደክሞኛል',
    phonetic: 'Dekmognall',
    category: 'emotions',
    categoryLabel: 'Emotions & State',
    handshapeDescription: "Both hands bent, fingertips touching near ribs, then slouching at wrists.",
    aslComparison: 'Similar to ASL except signed at ribs/stomach',
    handsCount: 2,
    pageNumber: 29,
    emoji: '🥱'
  },

  // Colors (Pages 29 - 33)
  {
    id: 'color_general',
    english: 'Color',
    amharic: 'ቀለም',
    phonetic: 'Qelem',
    category: 'colors',
    categoryLabel: 'Colors & Visuals',
    handshapeDescription: "Hand flat, palm facing chin, fingers wiggling touching lips.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 29,
    emoji: '🎨'
  },
  {
    id: 'color_red',
    english: 'Red',
    amharic: 'ቀይ',
    phonetic: 'Qey',
    category: 'colors',
    categoryLabel: 'Colors & Visuals',
    handshapeDescription: "'1' handshape touching lips and moving down, finger stays straight.",
    aslComparison: 'Finger stays straight and hand moves down',
    handsCount: 1,
    pageNumber: 30,
    emoji: '🔴'
  },
  {
    id: 'color_purple',
    english: 'Purple',
    amharic: 'ሐምራዊ',
    phonetic: 'Hamrawi',
    category: 'colors',
    categoryLabel: 'Colors & Visuals',
    handshapeDescription: "Ethiopian 'w' handshape turning back and forth slightly.",
    aslComparison: 'EthSL specific letter handshape shaking',
    handsCount: 1,
    pageNumber: 30,
    emoji: '🟣'
  },
  {
    id: 'color_pink',
    english: 'Pink',
    amharic: 'ሮዝ',
    phonetic: 'Roz',
    category: 'colors',
    categoryLabel: 'Colors & Visuals',
    handshapeDescription: "Ethiopian 'r' handshape touching lips and moving down.",
    aslComparison: 'Similar to red motion using Ethiopian r handshape',
    handsCount: 1,
    pageNumber: 30,
    emoji: '🌸'
  },
  {
    id: 'color_blue',
    english: 'Blue',
    amharic: 'ሰማያዊ',
    phonetic: 'Semayawi',
    category: 'colors',
    categoryLabel: 'Colors & Visuals',
    handshapeDescription: "Ethiopian 's' handshape turning back and forth slightly.",
    aslComparison: 'EthSL specific letter handshape shaking',
    handsCount: 1,
    pageNumber: 31,
    emoji: '🔵'
  },
  {
    id: 'color_brown',
    english: 'Brown',
    amharic: 'ቡናማ',
    phonetic: 'Bunama',
    category: 'colors',
    categoryLabel: 'Colors & Visuals',
    handshapeDescription: "'1' handshape touching the side of the nose and moving down.",
    aslComparison: 'Index finger sliding down nose',
    handsCount: 1,
    pageNumber: 31,
    emoji: '🟤'
  },
  {
    id: 'color_yellow',
    english: 'Yellow',
    amharic: 'ቢጫ',
    phonetic: 'Bicha',
    category: 'colors',
    categoryLabel: 'Colors & Visuals',
    handshapeDescription: "Ethiopian 'b' handshape turning back and forth slightly.",
    aslComparison: 'EthSL specific letter handshape shaking',
    handsCount: 1,
    pageNumber: 31,
    emoji: '🟡'
  },
  {
    id: 'color_green',
    english: 'Green',
    amharic: 'አረንጓዴ',
    phonetic: 'Arengwade',
    category: 'colors',
    categoryLabel: 'Colors & Visuals',
    handshapeDescription: "'a' handshape turning back and forth slightly.",
    aslComparison: 'EthSL specific letter handshape shaking',
    handsCount: 1,
    pageNumber: 32,
    emoji: '🟢'
  },
  {
    id: 'color_white',
    english: 'White',
    amharic: 'ነጭ',
    phonetic: 'Nech',
    category: 'colors',
    categoryLabel: 'Colors & Visuals',
    handshapeDescription: "Opened '5' handshape facing chest brought outward to flattened 'o' handshape.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 32,
    emoji: '⚪'
  },
  {
    id: 'color_black',
    english: 'Black',
    amharic: 'ጥቁር',
    phonetic: 'Tiqur',
    category: 'colors',
    categoryLabel: 'Colors & Visuals',
    handshapeDescription: "'1' handshape, starting above left eye and drawing line across eyebrows, palm facing down.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 32,
    emoji: '⚫'
  },

  // Numbers & Math (Pages 33 - 38)
  {
    id: 'count_numbers',
    english: 'Count / Numbers',
    amharic: 'ቁጥር',
    phonetic: 'Qutir',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "Left hand flat and positioned vertically, right hand in 'f' handshape touching wrist of left hand and moving up hand while touching it.",
    aslComparison: 'Similar to ASL sign for "numbers"',
    handsCount: 2,
    pageNumber: 33,
    emoji: '🔢'
  },
  {
    id: 'numbers_1_9',
    english: 'Numbers (1 - 9)',
    amharic: 'ቁጥሮች 1 - 9',
    phonetic: 'Qutiroch 1-9',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "Use standard handshapes 1-9 with palm facing out.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 35,
    emoji: '1️⃣'
  },
  {
    id: 'number_10',
    english: 'Number 10',
    amharic: 'አስር (10)',
    phonetic: 'Asir (10)',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "'a' handshape, shaking slightly back and forth.",
    aslComparison: 'Shaking thumb',
    handsCount: 1,
    pageNumber: 35,
    emoji: '🔟'
  },
  {
    id: 'numbers_11_19',
    english: 'Numbers (11 - 19)',
    amharic: 'ቁጥሮች 11 - 19',
    phonetic: 'Qutiroch 11-19',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "Use handshapes for 1-9, start with palm facing body, then turn outward toward camera.",
    aslComparison: 'Look like $1 - $9 but moving in opposite direction',
    handsCount: 1,
    pageNumber: 37,
    emoji: '🔢'
  },
  {
    id: 'number_20',
    english: 'Number 20',
    amharic: 'ሃያ (20)',
    phonetic: 'Haya (20)',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "Pointer and middle finger begin straight and bend twice.",
    aslComparison: 'Similar to "analyze"',
    handsCount: 1,
    pageNumber: 38,
    emoji: '2️⃣'
  },
  {
    id: 'math',
    english: 'Math',
    amharic: 'ሂሳብ',
    phonetic: 'Hisab',
    category: 'education_work',
    categoryLabel: 'Activities & School',
    handshapeDescription: "Flattened 'o' handshapes meet in front of the body, palms facing each other (left and right).",
    aslComparison: 'Same as the sign for "more"',
    handsCount: 2,
    pageNumber: 38,
    emoji: '📐'
  },
  {
    id: 'start_ethsl',
    english: 'Start',
    amharic: 'ጀምር',
    phonetic: 'Jemmir',
    category: 'education_work',
    categoryLabel: 'Activities & School',
    handshapeDescription: "Left hand in '5' handshape, right hand in '1' handshape, pointer finger between pointer and middle fingers on left hand. Move right hand like turning a key.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 38,
    emoji: '🚀'
  },
  {
    id: 'continue_ethsl',
    english: 'Continue',
    amharic: 'ቀጥል',
    phonetic: 'Qettil',
    category: 'education_work',
    categoryLabel: 'Activities & School',
    handshapeDescription: "Both hands in 'a' handshapes, touching at thumbs, palms facing outward. Both hands move outward together.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 39,
    emoji: '⏩'
  },
  {
    id: 'finish_ethsl',
    english: 'Finish',
    amharic: 'ጨርስ',
    phonetic: 'Cherris',
    category: 'education_work',
    categoryLabel: 'Activities & School',
    handshapeDescription: "Hands start in '5' handshapes facing each other. They move toward each other and end in 's' handshapes with the right hand closer to the body.",
    aslComparison: 'Similar to the sign for summary, signed in front of face',
    handsCount: 2,
    pageNumber: 39,
    emoji: '🏁'
  },
  {
    id: 'rest_break',
    english: 'Rest (take a break)',
    amharic: 'እረፍት',
    phonetic: 'Erefit',
    category: 'education_work',
    categoryLabel: 'Activities & School',
    handshapeDescription: "Both hands flat, lay arms on top of one another from elbow to fingertips.",
    aslComparison: 'ASL sign for "table"',
    handsCount: 2,
    pageNumber: 39,
    emoji: '🛋️'
  },

  // Days of the Week (Pages 40 - 42)
  {
    id: 'day_monday',
    english: 'Monday',
    amharic: 'ሰኞ',
    phonetic: 'Segno',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "Ethiopian 'S2' handshape shaking left and right.",
    aslComparison: 'Same location as ASL signs, movement like "bathroom"',
    handsCount: 1,
    pageNumber: 40,
    emoji: '📅'
  },
  {
    id: 'day_tuesday',
    english: 'Tuesday',
    amharic: 'ማክሰኞ',
    phonetic: 'Makisegno',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "Ethiopian 'm' handshape shaking left and right.",
    aslComparison: 'Movement like the sign for "bathroom"',
    handsCount: 1,
    pageNumber: 40,
    emoji: '📅'
  },
  {
    id: 'day_wednesday',
    english: 'Wednesday',
    amharic: 'ረቡዕ',
    phonetic: 'Rebu',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "Ethiopian 'r' handshape shaking left and right.",
    aslComparison: 'Movement like the sign for "bathroom"',
    handsCount: 1,
    pageNumber: 40,
    emoji: '📅'
  },
  {
    id: 'day_thursday',
    english: 'Thursday',
    amharic: 'ሐሙስ',
    phonetic: 'Hamus',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "Ethiopian 'H2' handshape shaking left and right.",
    aslComparison: 'Movement like the sign for "bathroom"',
    handsCount: 1,
    pageNumber: 40,
    emoji: '📅'
  },
  {
    id: 'day_friday',
    english: 'Friday',
    amharic: 'አርብ',
    phonetic: 'Arb',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "'f' handshape shaking left and right.",
    aslComparison: 'Movement like the sign for "bathroom"',
    handsCount: 1,
    pageNumber: 41,
    emoji: '📅'
  },
  {
    id: 'day_saturday',
    english: 'Saturday',
    amharic: 'ቅዳሜ',
    phonetic: 'Qidame',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "Ethiopian 'q' handshape shaking left and right.",
    aslComparison: 'Movement like the sign for "bathroom"',
    handsCount: 1,
    pageNumber: 41,
    emoji: '📅'
  },
  {
    id: 'day_sunday',
    english: 'Sunday',
    amharic: 'እሁድ',
    phonetic: 'Ehud',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "Both hands in Ethiopian 'g' handshapes, moving in circles.",
    aslComparison: 'Two-hand circular motion with Ethiopian g handshape',
    handsCount: 2,
    pageNumber: 41,
    emoji: '📅'
  },
  {
    id: 'day_today',
    english: 'Today',
    amharic: 'ዛሬ',
    phonetic: 'Zare',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "Both hands in 'y' handshapes in front of stomach, palms facing in.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 41,
    emoji: '📆'
  },
  {
    id: 'day_tomorrow',
    english: 'Tomorrow',
    amharic: 'ነገ',
    phonetic: 'Nege',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "'a' handshape touches cheek, then moves forward - away from the body.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 42,
    emoji: '🌅'
  },
  {
    id: 'day_yesterday',
    english: 'Yesterday',
    amharic: 'ትናንት',
    phonetic: 'Tinant',
    category: 'numbers_days',
    categoryLabel: 'Numbers & Calendar',
    handshapeDescription: "'a' handshape touches thumb on cheek close to lips and then moves to touch closer to ear on right side of face.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 42,
    emoji: '🌇'
  },

  // Transportation (Pages 43)
  {
    id: 'taxi',
    english: 'Taxi',
    amharic: 'ታክሲ',
    phonetic: 'Taxi',
    category: 'transport',
    categoryLabel: 'Places & Facilities',
    handshapeDescription: "Both hands in '1' handshapes, palms facing down, right pointer finger lays on top of left pointer finger and moves back and forth across finger.",
    aslComparison: 'Sign for "train" signed with \'1\' handshape',
    handsCount: 2,
    pageNumber: 43,
    emoji: '🚕'
  },
  {
    id: 'bajaj',
    english: 'Bajaj (Three-wheeler)',
    amharic: 'ባጃጅ',
    phonetic: 'Bajaj',
    category: 'transport',
    categoryLabel: 'Places & Facilities',
    handshapeDescription: "Ethiopian 'b' handshape, shake up and down twice.",
    aslComparison: 'Similar to the sign for "hunt"',
    handsCount: 1,
    pageNumber: 43,
    emoji: '🛺'
  },
  {
    id: 'car',
    english: 'Car',
    amharic: 'መኪና',
    phonetic: 'Mekina',
    category: 'transport',
    categoryLabel: 'Places & Facilities',
    handshapeDescription: "'s' handshapes, move like driving a steering wheel.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 43,
    emoji: '🚗'
  },
  {
    id: 'boat',
    english: 'Boat',
    amharic: 'ጀልባ',
    phonetic: 'Jelba',
    category: 'transport',
    categoryLabel: 'Places & Facilities',
    handshapeDescription: "Both hands flat and slightly bent next to each other, hands bounce in a forward motion.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 43,
    emoji: '⛵'
  },

  // Conversation & Questions (Pages 44 - 49)
  {
    id: 'name',
    english: 'Name',
    amharic: 'ስም',
    phonetic: 'Sim',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "Both hands in 'u' handshapes, palms facing in, right hand taps twice on left.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 44,
    emoji: '🏷️'
  },
  {
    id: 'what_is_your_name',
    english: 'What is your name?',
    amharic: 'ስምህ/ስምሽ ማን ነው?',
    phonetic: 'Simih / Simish man new?',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "Point at the person you're talking to with one finger, then sign 'name' ('u' handshapes tapping twice).",
    aslComparison: 'Same as "you name?"',
    handsCount: 2,
    pageNumber: 44,
    emoji: '❓'
  },
  {
    id: 'nice_to_meet_you',
    english: 'Nice to meet you',
    amharic: 'ደስ ብሎኛል',
    phonetic: 'Des Blognall',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "Happy: Both hands flat touching chest moving up. To meet: '1' handshapes pointing up run into each other in front of chest.",
    aslComparison: 'Same as "happy meet"',
    handsCount: 2,
    pageNumber: 44,
    emoji: '🤝'
  },
  {
    id: 'applause',
    english: 'Applause (Deaf Clapping)',
    amharic: 'ማጨብጨብ',
    phonetic: 'Machebcheb',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "'5' handshapes shaking back and forth next to head.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 45,
    emoji: '👏'
  },
  {
    id: 'ready',
    english: 'Ready',
    amharic: 'ዝግጁ',
    phonetic: 'Zigju',
    category: 'education_work',
    categoryLabel: 'Activities & School',
    handshapeDescription: "Both hands in 'b' handshapes moving parallel to each other from left to right.",
    aslComparison: 'Same as "plan"',
    handsCount: 2,
    pageNumber: 45,
    emoji: '👌'
  },
  {
    id: 'wait_ethsl',
    english: 'Wait',
    amharic: 'ቆይ / ጠብቅ',
    phonetic: 'Qoy / Tebbiq',
    category: 'courtesy',
    categoryLabel: 'Courtesy & Politeness',
    handshapeDescription: "Both hands in '5' handshapes with fingers wiggling, palms facing toward body with left hand further away than right.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 46,
    emoji: '⏳'
  },
  {
    id: 'write',
    english: 'Write',
    amharic: 'መፃፍ',
    phonetic: 'Metsaf',
    category: 'education_work',
    categoryLabel: 'Activities & School',
    handshapeDescription: "Right hand in shape like holding a pen, left hand flat. Right hand moves back and forth in writing motion.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 46,
    emoji: '✍️'
  },
  {
    id: 'draw',
    english: 'Draw',
    amharic: 'መሳል',
    phonetic: 'Mesal',
    category: 'education_work',
    categoryLabel: 'Activities & School',
    handshapeDescription: "Left hand flat and vertical, right hand in 'i' handshape moves back and forth down left hand.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 46,
    emoji: '🎨'
  },
  {
    id: 'animal',
    english: 'Animal',
    amharic: 'እንስሳ',
    phonetic: 'Insisa',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "Both hands bent and flat moving left and right in front of shoulders.",
    aslComparison: 'Same as ASL',
    handsCount: 2,
    pageNumber: 47,
    emoji: '🐾'
  },
  {
    id: 'yes_nod',
    english: 'Yes',
    amharic: 'አዎ',
    phonetic: 'Awo',
    category: 'courtesy',
    categoryLabel: 'Courtesy & Politeness',
    handshapeDescription: "'s' handshape making a nodding motion.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 47,
    emoji: '👍'
  },
  {
    id: 'no_shake',
    english: 'No',
    amharic: 'አይደለም / አይ',
    phonetic: 'Aydelem / Ay',
    category: 'courtesy',
    categoryLabel: 'Courtesy & Politeness',
    handshapeDescription: "'1' handshape shaking left to right, head moving the same way.",
    aslComparison: 'Similar to "where"',
    handsCount: 1,
    pageNumber: 47,
    emoji: '🙅'
  },
  {
    id: 'know',
    english: 'Know',
    amharic: 'አውቃለሁ',
    phonetic: 'Awqalehu',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "Flat hand tapping head.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 47,
    emoji: '💡'
  },
  {
    id: 'dont_know',
    english: "Don't know",
    amharic: 'አላውቅም',
    phonetic: 'Alawqim',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "Flat hand tapping head then moving away while shaking head 'no'.",
    aslComparison: 'Same as ASL',
    handsCount: 1,
    pageNumber: 48,
    emoji: '🤷'
  },
  {
    id: 'same',
    english: 'Same',
    amharic: 'ተመሳሳይ',
    phonetic: 'Temesusay',
    category: 'conversation',
    categoryLabel: 'Community & Culture',
    handshapeDescription: "'y' handshape with palm facing down moving back and forth.",
    aslComparison: 'Similar to ASL, palm faces down',
    handsCount: 1,
    pageNumber: 48,
    emoji: '🟰'
  },
  {
    id: 'forget',
    english: 'Forget',
    amharic: 'ረሳሁ',
    phonetic: 'Resahu',
    category: 'emotions',
    categoryLabel: 'Emotions & State',
    handshapeDescription: "Both hands start in 's' handshapes on sides of head, palms facing backward. Both hands move backward while opening into '5' handshapes.",
    aslComparison: '"Many" signed near ears',
    handsCount: 2,
    pageNumber: 48,
    emoji: '💭'
  },
  {
    id: 'student',
    english: 'Student',
    amharic: 'ተማሪ',
    phonetic: 'Temari',
    category: 'education_work',
    categoryLabel: 'Activities & School',
    handshapeDescription: "Both hands start in '5' handshapes and close into flattened 'o' handshapes twice, palms facing down.",
    aslComparison: '"Learn" signed with two hands',
    handsCount: 2,
    pageNumber: 49,
    emoji: '🎒'
  },
  {
    id: 'lazy',
    english: 'Lazy',
    amharic: 'ሰነፍ',
    phonetic: 'Senef',
    category: 'emotions',
    categoryLabel: 'Emotions & State',
    handshapeDescription: "Ethiopian 'S2' handshape on front of shoulder.",
    aslComparison: 'Same location as ASL, looks like "lazy" signed with an \'m\'',
    handsCount: 1,
    pageNumber: 49,
    emoji: '😴'
  }
];

// -----------------------------------------------------------------------------
// Part 2: EthSL Amharic Fidel Alphabet – 33 Consonants (Pages 50-58)
// -----------------------------------------------------------------------------
export const ETHSL_FIDEL_CONSONANTS: EthslFidelConsonant[] = [
  {
    letterId: 'H1',
    fidel: 'ሀ',
    romanization: 'H1 (Ha)',
    handshapeDescription: "Full hand in 'u' shape (fingers upright and together, thumb beside index).",
    aslEquivalent: 'Closest to a classifier for holding a book',
    pageNumber: 50
  },
  {
    letterId: 'L',
    fidel: 'ለ',
    romanization: 'L (La)',
    handshapeDescription: "ASL 'f' with pointer and middle finger touching thumb.",
    aslEquivalent: "Closest to the letter 'f'",
    pageNumber: 50
  },
  {
    letterId: 'H2',
    fidel: 'ሐ',
    romanization: 'H2 (Hha)',
    handshapeDescription: "Middle finger extended upward, all other fingers curled down.",
    aslEquivalent: 'Middle finger extended solitary',
    pageNumber: 50
  },
  {
    letterId: 'M',
    fidel: 'መ',
    romanization: 'M (Ma)',
    handshapeDescription: "All fingers together with bent hand, thumb sticks up between middle and ring fingers.",
    aslEquivalent: "Closest to the letter 'n'",
    pageNumber: 51
  },
  {
    letterId: 'S1',
    fidel: 'ሠ',
    romanization: 'S1 (Sza)',
    handshapeDescription: "'f' handshape (index and thumb touch, middle, ring, pinky extended).",
    aslEquivalent: "Same as 'f'",
    pageNumber: 51
  },
  {
    letterId: 'R',
    fidel: 'ረ',
    romanization: 'R (Ra)',
    handshapeDescription: "'u' handshape with thumb straight out to the side.",
    aslEquivalent: "Combinations of the letters 'u' and 'L'",
    pageNumber: 51
  },
  {
    letterId: 'S2',
    fidel: 'ሰ',
    romanization: 'S2 (Sa)',
    handshapeDescription: "Pointer, middle, and ring fingers together upright, pinky finger and thumb touching.",
    aslEquivalent: "Closest to the letter 'b'",
    pageNumber: 51
  },
  {
    letterId: 'SH',
    fidel: 'ሸ',
    romanization: 'SH (Sha)',
    handshapeDescription: "Full hand flat with all 4 fingers and thumb closely aligned together.",
    aslEquivalent: "Closest to the letter 'b'",
    pageNumber: 52
  },
  {
    letterId: 'Q',
    fidel: 'ቀ',
    romanization: 'Q (Qa)',
    handshapeDescription: "Pointer finger straight, thumb straight in front of pointer finger, other fingers in 'e' handshape.",
    aslEquivalent: "Closest to the letter 'e'",
    pageNumber: 52
  },
  {
    letterId: 'B',
    fidel: 'በ',
    romanization: 'B (Ba)',
    handshapeDescription: "'u' handshape with thumb extended in front of pointer and middle fingers.",
    aslEquivalent: "Handshape used for 'no'",
    pageNumber: 52
  },
  {
    letterId: 'T1',
    fidel: 'ተ',
    romanization: 'T1 (Ta)',
    handshapeDescription: "'t' handshape (thumb between index and middle curled fingers).",
    aslEquivalent: "Same as 't'",
    pageNumber: 52
  },
  {
    letterId: 'CH1',
    fidel: 'ቸ',
    romanization: 'CH1 (Cha)',
    handshapeDescription: "'t' handshape with a middle finger resting on tip of thumb.",
    aslEquivalent: 'Unique EthSL handshape (No direct ASL equivalent)',
    pageNumber: 53
  },
  {
    letterId: 'H3',
    fidel: 'ኅ',
    romanization: 'H3 (Hha)',
    handshapeDescription: "Index finger straight, middle finger and thumb form a half circle.",
    aslEquivalent: "Closest to the handshape for 'bagel'",
    pageNumber: 53
  },
  {
    letterId: 'N',
    fidel: 'ነ',
    romanization: 'N (Na)',
    handshapeDescription: "Pointer finger straight up, thumb resting right next to it.",
    aslEquivalent: "Closest to the number '1'",
    pageNumber: 53
  },
  {
    letterId: 'GN',
    fidel: 'ኘ',
    romanization: 'Ñ (Gna)',
    handshapeDescription: "Ethiopian 'n' with middle finger extended up alongside pointer.",
    aslEquivalent: "Closest to the letter 'u'",
    pageNumber: 53
  },
  {
    letterId: 'A1',
    fidel: 'አ',
    romanization: 'A1 (Alef)',
    handshapeDescription: "'a' handshape, thumb pointed straight up.",
    aslEquivalent: "Same as 'a'",
    pageNumber: 54
  },
  {
    letterId: 'K',
    fidel: 'ከ',
    romanization: 'K (Ka)',
    handshapeDescription: "Whole hand 'u'-shape, pointer extended forward, palm down.",
    aslEquivalent: "Forward-aimed index with palm down",
    pageNumber: 54
  },
  {
    letterId: 'H4',
    fidel: 'ኸ',
    romanization: 'H4 (Kha)',
    handshapeDescription: "Whole hand 'u'-shape, pointer and pinky extended, palm down.",
    aslEquivalent: "Closest to 'I love you' handshape facing down",
    pageNumber: 54
  },
  {
    letterId: 'W',
    fidel: 'ወ',
    romanization: 'W (Wa)',
    handshapeDescription: "'o'-shape with thumb, pointer, and middle fingers; other fingers resting against palm.",
    aslEquivalent: "Closest to the letter 'o'",
    pageNumber: 54
  },
  {
    letterId: 'A2',
    fidel: 'ዐ',
    romanization: 'A2 (Ayn)',
    handshapeDescription: "'o'-shape with thumb and pointer fingers, other fingers resting against palm.",
    aslEquivalent: "Closest to the letter 's'",
    pageNumber: 55
  },
  {
    letterId: 'Z',
    fidel: 'ዘ',
    romanization: 'Z (Za)',
    handshapeDescription: "'I love you' handshape with thumb holding middle and ring fingers down.",
    aslEquivalent: "Closest to the 'I love you' handshape",
    pageNumber: 55
  },
  {
    letterId: 'ZH',
    fidel: 'ዠ',
    romanization: 'ZH (Zha)',
    handshapeDescription: "Ethiopian 'z' with ring finger extended alongside pinky, thumb, and index.",
    aslEquivalent: 'Unique EthSL handshape (No direct ASL equivalent)',
    pageNumber: 55
  },
  {
    letterId: 'Y',
    fidel: 'የ',
    romanization: 'Y (Ya)',
    handshapeDescription: "Pointer finger extended upright, o-shape with thumb and middle fingers, other fingers against palm.",
    aslEquivalent: "Closest to the letter 'd'",
    pageNumber: 55
  },
  {
    letterId: 'D',
    fidel: 'ደ',
    romanization: 'D (Da)',
    handshapeDescription: "Middle finger extended perpendicular from palm, o-shape with thumb and pointer fingers, other fingers resting against palm.",
    aslEquivalent: 'Unique EthSL finger configuration',
    pageNumber: 56
  },
  {
    letterId: 'J',
    fidel: 'ጀ',
    romanization: 'J (Ja)',
    handshapeDescription: "Middle finger extended perpendicular from palm, o-shape with thumb and pointer fingers, pinky straight up, ring finger resting against palm.",
    aslEquivalent: 'Unique EthSL finger configuration',
    pageNumber: 56
  },
  {
    letterId: 'G',
    fidel: 'ገ',
    romanization: 'G (Ga)',
    handshapeDescription: "Hand flat, fingers together, thumb extended at right angle to other fingers.",
    aslEquivalent: "Handshape for 'please'",
    pageNumber: 56
  },
  {
    letterId: 'T2',
    fidel: 'ጠ',
    romanization: 'T2 (T\'a)',
    handshapeDescription: "'m' handshape (thumb tucked under three folded fingers).",
    aslEquivalent: "Closest to the letter 'm'",
    pageNumber: 56
  },
  {
    letterId: 'CH2',
    fidel: 'ጨ',
    romanization: 'CH2 (Ch\'a)',
    handshapeDescription: "'m' handshape with pinky straight up.",
    aslEquivalent: "Closest to the letter 'm' with pinky",
    pageNumber: 57
  },
  {
    letterId: 'P1',
    fidel: 'ጰ',
    romanization: 'P1 (P\'a)',
    handshapeDescription: "'o' handshape with pinky finger straight up.",
    aslEquivalent: "Closest to the letter 'o' with pinky",
    pageNumber: 57
  },
  {
    letterId: 'TS1',
    fidel: 'ጸ',
    romanization: 'TS1 (Tsa)',
    handshapeDescription: "'r' handshape with clear space between pointer and middle fingers.",
    aslEquivalent: "Closest to the letter 'r'",
    pageNumber: 57
  },
  {
    letterId: 'TS2',
    fidel: 'ፀ',
    romanization: 'TS2 (Ts\'a)',
    handshapeDescription: "Thumb and pinky touch around the front of the fist.",
    aslEquivalent: "Closest to the letter 's'",
    pageNumber: 57
  },
  {
    letterId: 'F',
    fidel: 'ፈ',
    romanization: 'F (Fa)',
    handshapeDescription: "'d' handshape, but fingers touch knuckle of thumb instead of tip.",
    aslEquivalent: "Closest to the letter 'd'",
    pageNumber: 57
  },
  {
    letterId: 'P2',
    fidel: 'ፐ',
    romanization: 'P2 (Pa)',
    handshapeDescription: "'p' handshape (index pointed forward, middle pointed down, thumb on middle).",
    aslEquivalent: "Same as 'p'",
    pageNumber: 58
  }
];

// -----------------------------------------------------------------------------
// Part 3: EthSL 7 Vowel Motion Rules (Pages 58-60)
// Consonant sound is represented by the handshape; vowel sound is represented by the movement!
// -----------------------------------------------------------------------------
export const ETHSL_VOWEL_RULES: EthslVowelRule[] = [
  {
    order: 1,
    vowelSound: '1st order: -eh or -i (short vowel)',
    sampleFidel: 'ሀ (Ge\'ez)',
    motionDescription: 'No movement. Hold the consonant handshape steady in space.',
    aslComparison: 'Similar to standard ASL letter positioning',
    pageNumber: 58
  },
  {
    order: 2,
    vowelSound: '2nd order: -oo',
    sampleFidel: 'ሁ (Ka\'eb)',
    motionDescription: 'In an arc to the left (like a graceful pouring motion).',
    aslComparison: 'Similar to a pouring motion',
    pageNumber: 58
  },
  {
    order: 3,
    vowelSound: '3rd order: -ee',
    sampleFidel: 'ሂ (Salis)',
    motionDescription: 'Straight to the right motion (heading east).',
    aslComparison: 'Movement for "east"',
    pageNumber: 59
  },
  {
    order: 4,
    vowelSound: '4th order: -ah',
    sampleFidel: 'ሃ (Rabi)',
    motionDescription: 'Straight down motion (heading south).',
    aslComparison: 'Movement for "south"',
    pageNumber: 59
  },
  {
    order: 5,
    vowelSound: '5th order: -ay (as in bay)',
    sampleFidel: 'ሄ (Hamis)',
    motionDescription: 'Circular motion in front of body.',
    aslComparison: 'Movement for "library"',
    pageNumber: 59
  },
  {
    order: 6,
    vowelSound: '6th order: No vowel / short neutral',
    sampleFidel: 'ህ (Sadis)',
    motionDescription: 'Downward motion, zigzagging left and right.',
    aslComparison: 'Similar to movement for "draw"',
    pageNumber: 60
  },
  {
    order: 7,
    vowelSound: '7th order: -oh',
    sampleFidel: 'ሆ (Sabi)',
    motionDescription: 'Wrist turns inward toward the signer.',
    aslComparison: 'Movement for "$1"',
    pageNumber: 60
  }
];
