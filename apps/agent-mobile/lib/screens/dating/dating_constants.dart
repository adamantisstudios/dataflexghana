/// Mirrors `lib/dating/constants.ts` and `lib/dating/profile-completeness.ts`
/// so the app offers exactly the option values the server accepts.
library;

const datingIntentions = <String, String>{
  'serious_relationship': 'Serious relationship',
  'marriage': 'Marriage',
  'friendship': 'Meaningful friendship',
  'open_to_possibilities_serious': 'Open to possibilities (serious only)',
};

const genderOptions = <String, String>{
  'male': 'Male',
  'female': 'Female',
  'other': 'Other',
};

const interestedInOptions = <String, String>{
  'male': 'Men',
  'female': 'Women',
  'everyone': 'Everyone',
};

const relationshipStatusOptions = <String>[
  'Single',
  'Divorced',
  'Widowed',
  'Separated',
];

const educationOptions = <String>[
  'High School',
  'Diploma',
  "Bachelor's",
  "Master's",
  'PhD',
  'Other',
];

const religionOptions = <String>['Christian', 'Muslim', 'Other', 'None'];

const lifestyleOptions = <String>['Never', 'Socially', 'Regularly'];

const childrenOptions = <String>[
  'None',
  'Have children',
  'Want children someday',
  'Not sure',
];

const personalityTraitOptions = <String>[
  'Outgoing',
  'Quiet',
  'Ambitious',
  'Funny',
  'Creative',
  'Caring',
  'Adventurous',
  'Thoughtful',
];

const weeklyAvailabilityOptions = <String>[
  'Weekends',
  'Evenings',
  'Anytime',
  'Weekdays',
];

const languageSuggestions = <String>['English', 'Twi', 'Ga', 'Ewe', 'Hausa', 'French'];

const interestSuggestions = <String>[
  'Music',
  'Movies',
  'Travel',
  'Cooking',
  'Fitness',
  'Reading',
  'Football',
  'Church',
  'Business',
  'Fashion',
  'Photography',
  'Volunteering',
];

const reportReasons = <String>[
  'Fake profile',
  'Harassment or abuse',
  'Inappropriate photos',
  'Scam or money request',
  'Underage',
  'Other',
];

const maxDatingPhotos = 5;
const counsellingSessionMinutes = 30;

const icebreakerFallbacks = <String>[
  "What's your favourite way to spend a Sunday?",
  'What values matter most to you in a relationship?',
  "What's something you're passionate about that you'd love to share?",
];

String intentionLabel(Object? raw) {
  final key = raw?.toString() ?? '';
  return datingIntentions[key] ?? (key.isEmpty ? 'Not set' : key);
}

/// Same scoring as `calculateProfileCompleteness` on the server, so the meter in
/// the editor tracks what will be stored after saving.
int calculateProfileCompleteness({
  String? displayName,
  String? bio,
  int? age,
  String? relationshipStatus,
  String? intentions,
  String? location,
  String? occupation,
  List<String> interests = const [],
  int photoCount = 0,
  int? heightCm,
  String? education,
  String? religion,
  String? drinking,
  String? smoking,
  String? children,
  List<String> languages = const [],
  List<String> personalityTraits = const [],
  String? weeklyAvailability,
}) {
  var score = 0;
  bool filled(String? v) => v != null && v.trim().isNotEmpty;

  if (filled(displayName)) score += 5;
  if (filled(bio)) score += 10;
  if (age != null && age >= 18) score += 5;
  if (filled(relationshipStatus)) score += 5;
  if (filled(intentions)) score += 10;
  if (filled(location)) score += 5;
  if (filled(occupation)) score += 5;
  if (interests.isNotEmpty) score += 10;

  if (photoCount >= 1) score += 15;
  if (photoCount >= 2) score += 5;
  if (photoCount >= 3) score += 5;
  if (photoCount >= 4) score += 5;
  if (photoCount >= 5) score += 5;

  final extras = <bool>[
    heightCm != null,
    filled(education),
    filled(religion),
    filled(drinking),
    filled(smoking),
    filled(children),
    languages.isNotEmpty,
    personalityTraits.isNotEmpty,
    filled(weeklyAvailability),
  ];
  for (final present in extras) {
    if (present) score += 2;
  }

  return score > 100 ? 100 : score;
}
