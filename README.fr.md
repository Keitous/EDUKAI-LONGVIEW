# EDUKAI AFRICA – LongView Agent



> **Intelligence longitudinale de l’apprentissage propulsée par MCP pour l’éducation en Afrique**



**African Agentic AI Design Challenge — Parcours Éducation**



EDUKAI AFRICA – LongView Agent est un prototype open source conçu pour aider les enseignants à comprendre l’évolution d’un apprenant dans le temps.



Au lieu d’examiner uniquement le résultat d’une évaluation ponctuelle, LongView analyse les données longitudinales d’apprentissage sur plusieurs périodes scolaires, récupère les éléments de preuve pertinents, identifie les forces durables ou les difficultés récurrentes et génère des recommandations fondées sur les données, soumises à l’appréciation de l’enseignant.



**L’agent recommande. L’enseignant décide.**



---



## Langues



**[English](README.md) | Français**



La documentation du projet est disponible en anglais et en français.



La couche agent, l'interface Web et les analyses générées prennent en charge le français et l'anglais.



---



## 1. Le problème



Dans de nombreux contextes éducatifs, particulièrement lorsque les infrastructures numériques et les ressources sont limitées, les informations relatives à un apprenant sont dispersées entre :



- les bulletins scolaires ;

- les registres de présence ;

- les évaluations ;

- les observations des enseignants ;

- différentes années scolaires ;

- différents systèmes administratifs.



Un enseignant peut ainsi connaître la dernière note d’un apprenant sans disposer immédiatement d’une vision claire de son évolution sur une période plus longue.



Il peut alors être difficile de répondre rapidement à des questions telles que :



- Cet apprenant progresse-t-il réellement dans le temps ?

- Une difficulté est-elle persistante ou temporaire ?

- Quelle matière présente la progression la plus durable ?

- Certaines données manquantes réduisent-elles la confiance dans l’analyse ?

- Quelles données justifient une recommandation ?



LongView vise à aider l’enseignant à répondre à ces questions tout en lui laissant la décision finale.



---



## 2. Contexte africain



EDUKAI AFRICA est conçu en tenant compte de contraintes importantes pour de nombreux systèmes éducatifs africains :



- fragmentation des données scolaires ;

- infrastructures numériques limitées ;

- contraintes de bande passante et de coût ;

- effectifs importants dans les classes ;

- charge de travail des enseignants ;

- données historiques parfois incomplètes ;

- environnements multilingues ;

- nécessité d’une IA explicable et auditable ;

- importance du contrôle humain dans les décisions éducatives.



Le prototype actuel utilise des données JSON locales légères et des profils d’apprenants entièrement synthétiques. Il peut ainsi démontrer son fonctionnement sans exposer les informations personnelles de véritables élèves.



À terme, cette architecture pourrait être adaptée à des systèmes d’information scolaires, des plateformes d’évaluation et d’autres sources éducatives autorisées.



---



## 3. Ce que fait LongView



Un enseignant peut sélectionner un apprenant et poser à LongView une question telle que :



> Analyse l’évolution de cet apprenant et identifie ses principales forces.



LongView peut ensuite :



1. récupérer le profil de l’apprenant ;

2. consulter les données scolaires et de présence disponibles sur plusieurs périodes ;

3. analyser les tendances longitudinales ;

4. identifier les évolutions positives, stables ou négatives ;

5. détecter les difficultés persistantes ;

6. identifier les données manquantes ;

7. récupérer les éléments de preuve soutenant l’analyse ;

8. générer une recommandation prudente ;

9. demander à l’enseignant d’approuver, modifier ou rejeter la recommandation.



Le prototype analyse actuellement des données synthétiques concernant :



- les Mathématiques ;

- les Sciences ;

- la Langue ;

- l’Assiduité.



---



## 4. Pourquoi LongView est un agent et pas un simple chatbot



LongView n’est pas conçu comme un simple système de questions-réponses.



Le LLM agit comme un orchestrateur capable de déterminer dynamiquement quels outils MCP sont nécessaires pour répondre à la demande de l’enseignant.



L’agent peut :



- interpréter la demande de l’enseignant ;

- sélectionner les outils MCP pertinents ;

- récupérer des informations structurées sur l’apprenant ;

- analyser les tendances longitudinales ;

- rechercher les preuves soutenant une conclusion ;

- raisonner à partir des résultats de plusieurs outils ;

- gérer les informations incomplètes ;

- produire une réponse fondée sur les données ;

- s’arrêter avant la décision finale réservée à l’enseignant.



La séquence des appels MCP dépend donc de la demande et des données disponibles plutôt que d’une réponse conversationnelle entièrement prédéfinie.



---



## 5. Architecture



```text

Enseignant

&#x20;   |

&#x20;   v

Interface Web LongView

&#x20;   |

&#x20;   v

API Web Express

&#x20;   |

&#x20;   v

Agent LLM / Orchestrateur

&#x20;   |

&#x20;   v

Model Context Protocol (MCP)

&#x20;   |

&#x20;   +-------------------------------+

&#x20;   |               |               |

&#x20;   v               v               v

Profil de       Analyse des      Recherche

l'apprenant     tendances        des preuves

&#x20;               longitudinales

&#x20;   |               |               |

&#x20;   +---------------+---------------+

&#x20;                   |

&#x20;                   v

&#x20;         Réponse fondée sur

&#x20;            les preuves

&#x20;                   |

&#x20;                   v

&#x20;         Validation de sécurité

&#x20;                   |

&#x20;                   v

&#x20;         Révision par l'enseignant

&#x20;       Approuver / Modifier / Rejeter

&#x20;                   |

&#x20;                   v

&#x20;             Journal d'audit

```



Le projet sépare notamment :



- l’interaction avec l’utilisateur ;

- le raisonnement du LLM ;

- l’exécution des outils MCP ;

- l’analyse longitudinale ;

- la récupération des preuves ;

- la sécurité des réponses ;

- la décision de l’enseignant ;

- la journalisation d’audit.



---



## 6. Model Context Protocol (MCP)



LongView utilise le **Model Context Protocol (MCP)** pour exposer à l’agent des capacités éducatives structurées.



Le serveur MCP enregistre actuellement quatre outils.



### `get_learner_profile`



Récupère le profil longitudinal structuré d’un apprenant.



### `analyze_longitudinal_trends`



Analyse les observations disponibles sur plusieurs périodes scolaires et identifie des tendances telles que :



- progression ;

- déclin ;

- stabilité ;

- données insuffisantes.



L’outil évalue également la complétude des données et le niveau de confiance associé aux observations disponibles.



### `retrieve_evidence`



Retourne les observations qui soutiennent une conclusion longitudinale, notamment :



- les valeurs disponibles ;

- les années ou périodes manquantes ;

- la première observation valide ;

- la dernière observation valide ;

- l’évolution calculée ;

- le nombre d’observations disponibles ;

- les informations relatives au niveau de confiance.



### `submit_teacher_review`



Enregistre la décision finale de l’enseignant dans le cadre du mécanisme **Human-in-the-Loop**.



Les décisions possibles sont volontairement limitées au workflow de révision prévu par le système.



Point essentiel : cet outil **n’est pas exposé au LLM comme outil autonome**.



L’agent ne peut donc pas approuver lui-même sa propre recommandation.



La révision reste une action humaine distincte.



---



## 7. Human-in-the-Loop dès la conception



LongView applique une règle simple :



> **L’agent recommande. L’enseignant décide.**



Le système ne permet pas au LLM d’exécuter de manière autonome l’action de validation réservée à l’enseignant.



L’enseignant peut :



- **Approuver** la recommandation ;

- **Modifier** la recommandation avec son propre commentaire ;

- **Rejeter** la recommandation.



L’API Web associe également chaque révision de l’enseignant à l’analyse qui l’a produite.



Le prototype rejette notamment :



- l’absence d’identifiant d’analyse ;

- un identifiant d’analyse inconnu ;

- une analyse soumise pour un autre apprenant ;

- un contenu d’analyse modifié ne correspondant pas à l’analyse enregistrée ;

- une décision d’enseignant non autorisée.



Cette architecture crée une séparation claire entre l’aide à la décision produite par l’IA et le jugement professionnel de l’enseignant.



---



## 8. Preuves et niveau de confiance



LongView est conçu pour distinguer une affirmation des données qui la soutiennent.



Pour chaque indicateur analysé, le système peut suivre :



- les observations utilisées ;

- les périodes manquantes ;

- la première observation valide ;

- la dernière observation valide ;

- l’évolution dans le temps ;

- la direction de la tendance ;

- la complétude des données ;

- le niveau de confiance.



Les données manquantes ne sont pas silencieusement transformées en données complètes.



Lorsque le nombre d’observations disponibles est insuffisant, le système peut explicitement indiquer que les données sont insuffisantes au lieu d’inventer une tendance.



---



## 9. Sécurité des réponses



Le prototype intègre une couche déterministe de contrôle de sécurité des réponses.



Elle vérifie actuellement certaines catégories ciblées d’affirmations non justifiées, notamment :



- certaines explications causales non soutenues par les données ;

- certains calendriers de suivi ou délais précis non soutenus par les données.



Lorsqu’une réponse générée enfreint ces règles, elle peut être rejetée et reformulée avant d’être présentée comme réponse finale.



Ce mécanisme doit être compris comme un **garde-fou ciblé du prototype** et non comme une garantie de détection de toutes les hallucinations possibles d’un modèle d’IA.



---



## 10. Auditabilité



LongView peut enregistrer l’activité de l’agent dans un journal d’audit.



Le mécanisme d’audit permet notamment d’enregistrer :



- la création d’une session ;

- les actions MCP ;

- la frontière Human-in-the-Loop ;

- certaines métadonnées finales du workflow.



Les clés API ne sont pas intentionnellement enregistrées dans le journal d’audit.



Les fichiers de logs d’exécution sont exclus du dépôt Git.



---



## 11. Données synthétiques et confidentialité



Le dépôt utilise **uniquement des données synthétiques d’apprenants**.



Aucune information personnelle réelle d’un élève n’est nécessaire pour exécuter la démonstration.



Les scénarios inclus représentent plusieurs situations longitudinales :



| Apprenant | Scénario de démonstration |

|---|---|

| LRN001 | Forte progression scolaire |

| LRN002 | Difficultés persistantes |

| LRN003 | Tendances longitudinales en baisse |

| LRN004 | Profil stable |

| LRN005 | Données longitudinales incomplètes |



Ces scénarios permettent de démontrer l’agent, les outils MCP et les mécanismes de fiabilité sans publier de véritables données d’élèves.



---



## 12. Technologies utilisées



- Node.js

- Express

- Model Context Protocol SDK

- Groq SDK

- Zod

- HTML / CSS / JavaScript

- Jeu de données longitudinales synthétiques au format JSON

- Git



L’environnement de développement actuellement testé utilise Node.js 20.



---



## 13. Installation



### Prérequis



Installez :



- Node.js 20 ou une version compatible ;

- npm ;

- Git.



Clonez le dépôt :



```bash

git clone https://github.com/Keitous/EDUKAI-LONGVIEW

cd EDUKAI-LONGVIEW

```



Installez les dépendances :



```bash

npm install

```



---



## 14. Configuration de l’environnement



Copiez le fichier d’exemple :



```bash

cp .env.example .env

```



Sous Windows PowerShell :



```powershell

Copy-Item .env.example .env

```



Configurez ensuite le fournisseur utilisé par le prototype.



Exemple :



```env

LLM_PROVIDER=groq

LLM_MODEL=openai/gpt-oss-120b

GROQ_API_KEY=VOTRE_CLE_API

```



Ne publiez jamais le véritable fichier `.env` ni vos clés API.



Le fichier `.gitignore` du projet exclut `.env`.



---



## 15. Lancer LongView



Démarrez l’application Web :



```bash

npm start

```



L’interface locale est accessible à l’adresse :



```text

http://localhost:3000

```



Le point de contrôle de santé de l’API est disponible à :



```text

http://localhost:3000/api/health

```



---



## 16. Démonstration



Une démonstration simple peut être réalisée comme suit :



1. Démarrer LongView avec `npm start`.

2. Ouvrir `http://localhost:3000`.

3. Sélectionner `LRN001`.

4. Poser par exemple la question :



```text

Analyse l'évolution de cet apprenant et identifie ses principales forces.

```



5. Lancer l’analyse LongView.

6. Observer l’analyse longitudinale et les preuves produites.

7. Examiner la recommandation.

8. L’approuver, la modifier ou la rejeter en tant qu’enseignant.



Pendant une analyse, la sélection de l’apprenant est temporairement verrouillée afin d’éviter qu’une analyse en cours soit ensuite affichée sous le nom d’un autre apprenant.



---



## 17. Tests et évaluation



Exécutez l’ensemble des tests :



```bash

npm test

```



Les différentes familles de tests peuvent également être exécutées séparément :



```bash

npm run test:evaluation

npm run test:evidence

npm run test:audit

npm run test:safety

npm run test:web

```



### Résultats actuellement obtenus



#### Évaluation longitudinale



**5 scénarios synthétiques sur 5 réussis**



Les scénarios couvrent :



- l’émergence de forces avec un niveau de confiance élevé ;

- les difficultés persistantes ;

- les tendances longitudinales en baisse ;

- un profil stable sans fausse alerte ;

- les données manquantes avec un niveau de confiance limité.



Ce résultat concerne uniquement les scénarios synthétiques déterministes inclus dans le projet.



Il **ne signifie pas que l’IA possède une précision générale de 100 % dans des situations réelles**.



#### Recherche de preuves



**2 scénarios de régression sur 2 réussis**



Ils comprennent :



- des preuves complètes avec un niveau de confiance élevé ;

- des preuves incomplètes préservant les valeurs manquantes avec un niveau de confiance limité.



#### Sécurité des réponses



**3 scénarios de sécurité ciblés sur 3 réussis**



Ils couvrent :



- certaines affirmations causales non justifiées ;

- certains calendriers de suivi non justifiés ;

- des réponses prudentes fondées sur les données disponibles.



#### API Web / intégrité Human-in-the-Loop



**8 scénarios API Web sur 8 réussis**



Ils comprennent notamment :



- la disponibilité du jeu de données synthétiques ;

- les métadonnées de santé et de sécurité ;

- les résumés des apprenants ;

- l’obligation de fournir un identifiant d’analyse ;

- le rejet des identifiants d’analyse inconnus ;

- le rejet d’une révision associée au mauvais apprenant ;

- le rejet d’un contenu d’analyse modifié ;

- le rejet d’une décision d’enseignant non prise en charge.



#### Audit



Le test d’audit vérifie notamment :



- la création de la session d’audit ;

- l’enregistrement des actions MCP ;

- l’enregistrement de la frontière Human-in-the-Loop ;

- l’absence de champs de clés API dans la sortie d’audit testée.



---



## 18. Structure du projet



```text

EDUKAI-LONGVIEW/

|

+-- data/

|   +-- learners.json

|

+-- docs/

|

+-- public/

|   +-- index.html

|   +-- app.js

|   +-- styles.css

|

+-- src/

|   +-- agent.js

|   +-- audit-logger.js

|   +-- evidence-retriever.js

|   +-- llm-agent.js

|   +-- llm-config.js

|   +-- mcp-server.js

|   +-- response-safety.js

|   +-- translations.js

|   +-- trend-analyzer.js

|   +-- web-server.js

|

+-- tests/

|   +-- test-audit.js

|   +-- test-evaluation.js

|   +-- test-evidence.js

|   +-- test-response-safety.js

|   +-- test-web-api.js

|

+-- .env.example

+-- .gitignore

+-- LICENSE

+-- package.json

+-- README.md

+-- README.fr.md

```



---



## 19. Principes de fiabilité



LongView applique plusieurs principes de conception défensive.



### Les preuves avant la recommandation



Les recommandations doivent être fondées sur les observations récupérées concernant l’apprenant.



### Une donnée manquante reste une donnée manquante



Les observations absentes sont conservées comme telles au lieu d’être silencieusement inventées.



### Le niveau de confiance reflète la disponibilité des données



Des preuves incomplètes peuvent réduire le niveau de confiance associé à l’analyse.



### Aucune approbation autonome par l’agent



Le LLM ne peut pas appeler l’outil Human-in-the-Loop afin d’approuver lui-même sa recommandation.



### Démonstration fondée sur des données synthétiques



Le prototype public évite l’exposition de données réelles d’apprenants.



### Actions auditables



Les actions importantes de l’agent et des outils MCP peuvent être enregistrées pour inspection ultérieure.



---



## 20. Limites actuelles du prototype



LongView est un prototype développé dans le cadre d’un challenge. Il ne constitue pas encore un système d’information scolaire de production.



Ses limites actuelles comprennent notamment :



- le jeu de données de démonstration est synthétique ;

- le registre des analyses est actuellement conservé en mémoire et est réinitialisé lors du redémarrage du serveur ;

- l’authentification et l’autorisation adaptées à un environnement de production ne sont pas encore implémentées ;

- le détecteur de sécurité des réponses cible certaines catégories d’affirmations et n’est pas exhaustif ;

- le niveau de confiance reflète la disponibilité et la complétude des preuves et non une garantie de justesse pédagogique ;

- l'interface Web et les analyses générées par l'agent prennent en charge le français et l'anglais ;

- la persistance à grande échelle, la gestion du consentement et la gouvernance institutionnelle des données restent des travaux futurs ;

- le prototype ne prend pas de décisions éducatives importantes de manière autonome.



---



## 21. Feuille de route



Les évolutions envisagées comprennent :



- la persistance des analyses et des révisions ;

- l’authentification des enseignants ;

- la gestion des droits par école et par classe ;

- l’intégration à des systèmes d’information éducatifs autorisés ;

- des interfaces multilingues plus complètes ;

- la prise en charge progressive de langues africaines ;

- des indicateurs adaptés aux programmes scolaires ;

- des tableaux de bord pour les enseignants ;

- des jeux de données d’évaluation plus larges ;

- une évaluation renforcée des mécanismes de sécurité ;

- des workflows de confidentialité et de consentement ;

- une optimisation pour les environnements à faible bande passante.



---



## 22. Pourquoi ce projet est important



L’intelligence artificielle éducative ne devrait pas uniquement répondre à des questions.



Elle devrait aider les professionnels de l’éducation à comprendre les informations accumulées dans le temps tout en respectant les limites de ces informations.



LongView explore une architecture agentique dans laquelle :



- le LLM raisonne ;

- MCP fournit des outils structurés ;

- les données longitudinales fournissent le contexte ;

- les preuves soutiennent les affirmations ;

- les mécanismes de sécurité encadrent les réponses ;

- l’enseignant conserve l’autorité finale.



Cette combinaison est particulièrement pertinente lorsque les enseignants ont besoin d’une assistance utile de l’IA sans abandonner leur jugement professionnel.



---



## 23. African Agentic AI Design Challenge



**Parcours :** Éducation  

**Projet :** EDUKAI AFRICA – LongView Agent



Le projet démontre :



- un raisonnement agentique en plusieurs étapes ;

- une utilisation dynamique des outils MCP ;

- une analyse éducative longitudinale ;

- la récupération de preuves ;

- la gestion des données incomplètes ;

- un contrôle décisionnel Human-in-the-Loop ;

- des mécanismes ciblés de sécurité des réponses ;

- l’auditabilité ;

- des données synthétiques respectueuses de la confidentialité ;

- des tests open source reproductibles.



Le projet repose sur un principe simple :



> **Utiliser l’IA pour renforcer la vision à long terme de l’enseignant — et non pour remplacer l’enseignant.**



---



## 24. Dépôt et démonstration



**Code source :**  

`https://github.com/Keitous/EDUKAI-LONGVIEW`



**Démonstration en ligne :**  

`https://edukai-longview.onrender.com`



**Vidéo de démonstration :**  

`<URL-DE-LA-VIDEO>`



Ces liens seront mis à jour lorsque le dépôt public, le déploiement et la vidéo de démonstration du challenge seront disponibles.



---



## 25. Auteur



**Ousmane KEITA**  

Guinée



EDUKAI AFRICA – LongView Agent  

African Agentic AI Design Challenge — Parcours Éducation



---



## Licence



Ce prototype est distribué sous **licence ISC**.



Le texte complet de la licence est disponible dans le fichier [`LICENSE`](LICENSE).
