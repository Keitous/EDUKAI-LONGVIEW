# EDUKAI AFRICA – LongView Agent

**English | [Français](README.fr.md)**



> **MCP-powered longitudinal learning intelligence for African education**



**African Agentic AI Design Challenge — Education Track**



EDUKAI AFRICA – LongView Agent is an open-source prototype designed to help teachers understand how a learner evolves over time.



Instead of looking at a single test score, LongView examines longitudinal learning records across multiple academic periods, retrieves supporting evidence, identifies sustained strengths or recurring difficulties, and generates evidence-backed recommendations for teacher review.



**The agent recommends. The teacher decides.**



---



## 1. The Problem



In many educational contexts, especially where digital infrastructure and resources are limited, learner information is fragmented across:



- report cards;

- attendance records;

- assessments;

- teacher observations;

- different academic years;

- separate administrative systems.



A teacher may therefore see a learner's latest score without easily seeing the longer-term pattern behind it.



This can make questions such as the following difficult to answer quickly:



- Is this learner genuinely improving over time?

- Is a difficulty persistent or temporary?

- Which subject shows the strongest sustained progress?

- Are there missing records that reduce confidence in the analysis?

- What evidence supports a recommendation?



LongView is designed to help answer these questions while keeping the teacher in control.



---



## 2. African Context



EDUKAI AFRICA is designed around constraints that matter in African education systems:



- fragmented learner records;

- limited digital infrastructure;

- bandwidth and affordability constraints;

- large classes and teacher workload;

- incomplete historical data;

- multilingual environments;

- need for explainable and auditable AI;

- importance of human oversight in educational decisions.



The current prototype uses lightweight local JSON data and synthetic learner records so that the core workflow can be demonstrated without exposing real student information.



The architecture is intended to evolve toward integration with school information systems, assessment platforms and other authorized educational data sources.



---



## 3. What LongView Does



A teacher can select a learner and ask LongView a question such as:



> Analyze this learner's evolution and identify the main strengths.



LongView can then:



1. retrieve the learner profile;

2. inspect longitudinal academic and attendance records;

3. analyze trends across multiple periods;

4. identify improving, stable or declining patterns;

5. recognize persistent difficulties;

6. detect missing data;

7. retrieve evidence supporting the analysis;

8. generate a cautious recommendation;

9. require a teacher to approve, modify or reject the recommendation.



The prototype currently analyzes synthetic learner records across:



- Mathematics;

- Science;

- Language;

- Attendance.



---



## 4. Why LongView Is Agentic



LongView is not designed as a simple question-answering chatbot.



The LLM acts as an orchestrator that can dynamically determine which available MCP tools are needed to answer a teacher's question.



The agent can:



- interpret the teacher's request;

- select relevant MCP tools;

- retrieve structured learner information;

- analyze longitudinal trends;

- request supporting evidence;

- reason across multiple tool results;

- handle incomplete information;

- produce an evidence-grounded response;

- stop before consequential teacher approval.



The exact sequence of MCP calls is therefore driven by the request and available evidence rather than by a single hard-coded conversational response.



---



## 5. Architecture



```text

Teacher

&#x20;  |

&#x20;  v

LongView Web Interface

&#x20;  |

&#x20;  v

Express Web API

&#x20;  |

&#x20;  v

LLM Agent / Orchestrator

&#x20;  |

&#x20;  v

Model Context Protocol (MCP)

&#x20;  |

&#x20;  +-------------------------------+

&#x20;  |               |               |

&#x20;  v               v               v

Learner        Longitudinal     Evidence

Profile        Trend Analysis   Retrieval

&#x20;  |               |               |

&#x20;  +---------------+---------------+

&#x20;                  |

&#x20;                  v

&#x20;         Evidence-backed response

&#x20;                  |

&#x20;                  v

&#x20;           Safety validation

&#x20;                  |

&#x20;                  v

&#x20;            Teacher Review

&#x20;         Approve / Modify / Reject

&#x20;                  |

&#x20;                  v

&#x20;               Audit

```



The project separates:



- user interaction;

- LLM reasoning;

- MCP tool execution;

- longitudinal analytics;

- evidence retrieval;

- response safety;

- teacher decision-making;

- audit logging.



---



## 6. Model Context Protocol (MCP)



LongView uses the Model Context Protocol to expose structured educational capabilities to the agent.



The MCP server currently registers four tools.



### `get_learner_profile`



Retrieves the structured longitudinal profile of a learner.



### `analyze_longitudinal_trends`



Analyzes available observations across academic periods and identifies patterns such as:



- improving;

- declining;

- stable;

- insufficient data.



It also evaluates data completeness and confidence.



### `retrieve_evidence`



Returns the observations supporting a longitudinal claim, including:



- available values;

- missing years;

- first and last valid observations;

- calculated change;

- number of observations;

- confidence information.



### `submit_teacher_review`



Records the teacher's final Human-in-the-Loop decision.



Possible decisions are intentionally restricted to the supported review workflow.



Importantly, this tool is **not exposed to the LLM as an autonomous tool**. The agent cannot approve its own recommendation.



Teacher review remains a separate human action.



---



## 7. Human-in-the-Loop by Design



LongView follows a simple rule:



> **Agent recommends, teacher decides.**



The system does not allow the LLM to autonomously execute the teacher review action.



The teacher can:



- **Approve** the recommendation;

- **Modify** it with teacher input;

- **Reject** it.



The Web API also binds each teacher review to the analysis that produced it.



The prototype rejects:



- missing analysis identifiers;

- unknown analysis identifiers;

- an analysis submitted for the wrong learner;

- modified analysis content that does not match the registered analysis;

- unsupported teacher decisions.



This creates a clear boundary between AI-generated decision support and human educational judgment.



---



## 8. Evidence and Confidence



LongView is designed to distinguish between a claim and the evidence supporting that claim.



For each analyzed metric, the system can track:



- observations used;

- missing periods;

- first valid observation;

- last valid observation;

- change over time;

- direction of the trend;

- data completeness;

- confidence.



Incomplete data is not silently converted into a complete history.



When insufficient observations are available, the system can explicitly return an insufficient-data state rather than inventing a trend.



---



## 9. Response Safety



The prototype includes a deterministic response-safety layer.



It currently checks selected categories of unsupported claims, including:



- unsupported causal explanations;

- unsupported follow-up schedules or precise timelines.



If a generated response violates these rules, the response can be rejected and rewritten before being presented as the final answer.



This safety mechanism is intentionally described as a **targeted prototype guardrail**, not as a guarantee that every possible hallucination can be detected.



---



## 10. Auditability



LongView records agent activity in an audit trail.



The audit workflow can record:



- session creation;

- MCP actions;

- the Human-in-the-Loop boundary;

- final workflow metadata.



API keys are not intentionally written into the audit record.



Runtime logs are excluded from Git.



---



## 11. Synthetic Data and Privacy



The repository uses **synthetic learner data only**.



No real learner personally identifiable information is required to run the demonstration.



The included scenarios represent several longitudinal situations:



| Learner | Demonstration scenario |

|---|---|

| LRN001 | Strong academic progression |

| LRN002 | Persistent difficulties |

| LRN003 | Declining longitudinal trends |

| LRN004 | Stable profile |

| LRN005 | Incomplete longitudinal data |



This allows the agent, MCP tools and reliability mechanisms to be demonstrated without publishing real student records.



---



## 12. Technology Stack



- Node.js

- Express

- Model Context Protocol SDK

- Groq SDK

- Zod

- HTML / CSS / JavaScript

- JSON synthetic longitudinal dataset

- Git



The current tested development environment uses Node.js 20.



---



## 13. Installation



### Prerequisites



Install:



- Node.js 20 or compatible version;

- npm;

- Git.



Clone the repository:



```bash

git clone https://github.com/Keitous/EDUKAI-LONGVIEW.git

cd EDUKAI-LONGVIEW

```



Install dependencies:



```bash

npm install

```



---



## 14. Environment Configuration



Copy the example environment file:



```bash

cp .env.example .env

```



On Windows PowerShell, you can use:



```powershell

Copy-Item .env.example .env

```



Configure the provider used by the prototype.



Example:



```env

LLM_PROVIDER=groq

LLM_MODEL=openai/gpt-oss-120b

GROQ_API_KEY=YOUR_API_KEY

```



Never commit the real `.env` file or API keys.



The repository's `.gitignore` excludes `.env`.



---



## 15. Run LongView



Start the Web application:



```bash

npm start

```



The local interface is available at:



```text

http://localhost:3000

```



The health endpoint is available at:



```text

http://localhost:3000/api/health

```



---



## 16. Demo Workflow



A simple demonstration can be performed as follows:



1. Start LongView with `npm start`.

2. Open `http://localhost:3000`.

3. Select `LRN001`.

4. Ask:



```text

Analyze this learner's evolution and identify the main strengths.

```



5. Start the LongView analysis.

6. Observe the generated longitudinal analysis and supporting evidence.

7. Review the recommendation.

8. Approve, modify or reject it as the teacher.



While an analysis is running, learner selection is temporarily locked to prevent the UI from displaying an in-flight analysis under a different learner.



---



## 17. Tests and Evaluation



Run the complete test suite:



```bash

npm test

```



Individual test families are also available:



```bash

npm run test:evaluation

npm run test:evidence

npm run test:audit

npm run test:safety

npm run test:web

```



### Current tested scenarios



#### Longitudinal evaluation



**5 / 5 synthetic evaluation scenarios passed**



The scenarios cover:



- emerging strengths with high confidence;

- persistent difficulties;

- declining longitudinal trends;

- stable profile without false alerts;

- missing data with limited confidence.



This result refers only to the included deterministic synthetic evaluation scenarios. It must **not** be interpreted as 100% real-world AI accuracy.



#### Evidence retrieval



**2 / 2 evidence regression scenarios passed**



The tests include:



- complete evidence with high confidence;

- incomplete evidence with preserved missing values and limited confidence.



#### Response safety



**3 / 3 targeted safety scenarios passed**



The tests cover:



- unsupported causal claims;

- unsupported follow-up schedules;

- cautious evidence-based responses.



#### Web API / Human-in-the-Loop integrity



**8 / 8 Web API scenarios passed**



These include:



- synthetic dataset availability;

- health and safety metadata;

- learner summaries;

- mandatory analysis identifiers;

- rejection of unknown analysis identifiers;

- rejection of cross-learner analysis reviews;

- rejection of modified analysis content;

- rejection of unsupported teacher decisions.



#### Audit



The audit test verifies:



- audit session creation;

- MCP action recording;

- Human-in-the-Loop boundary recording;

- absence of API-key fields in the tested audit output.



---



## 18. Project Structure



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

+-- package.json

+-- README.md

```



---



## 19. Reliability Principles



LongView follows several defensive design principles:



### Evidence before recommendation



Recommendations should be grounded in retrieved learner observations.



### Missing data remains missing



Missing observations are preserved rather than silently fabricated.



### Confidence reflects data availability



Incomplete evidence can reduce confidence.



### No autonomous teacher approval



The LLM cannot invoke the Human-in-the-Loop review tool to approve itself.



### Synthetic-first demonstration



The public prototype avoids exposing real learner data.



### Auditable actions



Important agent and MCP actions can be recorded for later inspection.



---



## 20. Known Prototype Limitations



LongView is a challenge prototype, not a production student information system.



Current limitations include:



- the demonstration dataset is synthetic;

- the analysis registry is currently stored in server memory and resets when the server restarts;

- production authentication and authorization are not yet implemented;

- the current response-safety detector targets selected unsupported-claim patterns and is not exhaustive;

- confidence represents evidence availability and completeness, not guaranteed pedagogical correctness;

- the Web interface and agent-generated analyses support both French and English;

- production-scale persistence, consent management and institutional data governance remain future work;

- the current prototype does not make autonomous high-stakes educational decisions.



---



## 21. Roadmap



Possible next steps include:



- persistent analysis and review storage;

- authenticated teacher accounts;

- school and classroom access controls;

- integration with authorized education information systems;

- richer multilingual interfaces;

- support for additional African languages;

- configurable curriculum indicators;

- teacher dashboards;

- broader evaluation datasets;

- expanded safety evaluation;

- privacy and consent workflows;

- deployment for low-bandwidth environments.



---



## 22. Why This Matters



Educational AI should not only answer questions.



It should help educators understand evidence accumulated over time while respecting the limits of that evidence.



LongView explores an agentic architecture where:



- the LLM reasons;

- MCP provides structured tools;

- longitudinal data provides context;

- evidence supports claims;

- safety mechanisms constrain responses;

- and the teacher retains final authority.



That combination is especially relevant where educators need useful AI assistance without surrendering professional judgment.



---



## 23. African Agentic AI Design Challenge



**Track:** Education  

**Project:** EDUKAI AFRICA – LongView Agent



The project demonstrates:



- agentic multi-step reasoning;

- dynamic MCP tool use;

- longitudinal educational analysis;

- evidence retrieval;

- incomplete-data handling;

- Human-in-the-Loop decision control;

- targeted response safety;

- auditability;

- synthetic privacy-safe demonstration data;

- reproducible open-source testing.



The project is designed around a simple principle:



> **Use AI to strengthen the teacher's long view — not to replace the teacher.**



---



## 24. Repository and Demo



**Source code:**  

`https://github.com/Keitous/EDUKAI-LONGVIEW`



**Live demo:**  

`https://edukai-longview.onrender.com`



**Demo video:**  

`<DEMO-VIDEO-URL>`



These links will be updated when the public repository, deployment and challenge demonstration video are available.



---



## 25. Author



**Ousmane KEITA**  

Guinea



EDUKAI AFRICA – LongView Agent  

African Agentic AI Design Challenge — Education Track



---



## License



This prototype is currently configured with the ISC license in `package.json`.
