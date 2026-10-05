const translations = {
  fr: {
    title: "EDUKAI AFRICA - AGENT LONGVIEW",
    goal: "Objectif : analyser les forces émergentes de l'apprenant",
    plan: "PLAN D'ANALYSE",
    step1: "Récupérer le profil de l'apprenant",
    step2: "Analyser son évolution sur plusieurs années",
    step3: "Identifier la progression la plus importante",
    step4: "Récupérer les preuves correspondantes",
    step5: "Produire une recommandation argumentée",
    learner: "Apprenant",
    strongest: "Progression la plus importante",
    evidence: "Preuves",
    recommendation: "Recommandation",
    humanReview: "VALIDATION HUMAINE",
    noAction: "Aucune décision éducative n'a été exécutée automatiquement.",
    teacherRequired: "La validation de l'enseignant est obligatoire.",
    mathematics: "Mathématiques",
    science: "Sciences",
    language: "Langue",
    attendance: "Présence",
    recommendationText:
      "Reconnaître la progression de {name} en {subject} et envisager des activités adaptées, sous la supervision de l'enseignant."
  },

  en: {
    title: "EDUKAI AFRICA - LONGVIEW AGENT",
    goal: "Goal: analyze emerging strengths for learner",
    plan: "ANALYSIS PLAN",
    step1: "Retrieve learner profile",
    step2: "Analyze longitudinal progress",
    step3: "Identify strongest improvement",
    step4: "Retrieve supporting evidence",
    step5: "Generate an evidence-based recommendation",
    learner: "Learner",
    strongest: "Strongest improvement",
    evidence: "Evidence",
    recommendation: "Recommendation",
    humanReview: "HUMAN REVIEW",
    noAction: "No educational decision has been executed automatically.",
    teacherRequired: "Teacher validation is required.",
    mathematics: "Mathematics",
    science: "Science",
    language: "Language",
    attendance: "Attendance",
    recommendationText:
      "Recognize {name}'s progress in {subject} and consider appropriate learning activities under teacher supervision."
  }
};

function getTranslations(language = "fr") {
  const normalized = String(language).toLowerCase();

  if (!Object.prototype.hasOwnProperty.call(translations, normalized)) {
    throw new Error(
      `Unsupported language: ${language}. Supported languages: fr, en`
    );
  }

  return translations[normalized];
}

module.exports = {
  getTranslations
};
