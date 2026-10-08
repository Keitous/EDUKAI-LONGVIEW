# EDUKAI AFRICA – LongView Agent
## Technical Architecture and MCP Integration

### 1. Project Overview

EDUKAI AFRICA – LongView Agent is an agentic AI
decision-support system designed to help educators
understand learners' academic development over time.

The system analyzes longitudinal educational records,
identifies emerging strengths and persistent difficulties,
retrieves supporting evidence, and generates cautious
pedagogical recommendations.

AI recommends. Teachers decide.

### 2. Core Technology Stack

- Runtime: Node.js
- Programming language: JavaScript
- Web framework: Express
- LLM inference provider: Groq
- Language model: openai/gpt-oss-120b
- Model category: Open-weight language model
- Agent orchestration: Custom JavaScript orchestration
- MCP implementation: Official JavaScript MCP SDK
- MCP transport: stdio
- Input validation: Zod
- Educational data: Synthetic JSON records
- Hosting: Render
- Source code: GitHub

### 3. Agent Architecture

The system includes a web interface, an LLM-driven
agent, MCP clients, internal and external MCP servers,
educational analysis modules, and a human review layer.

The agent can select and invoke tools to retrieve
learner information, analyze multi-year trends,
retrieve supporting evidence, and consult
pedagogical guidance.

The LLM receives tool results as context before
generating a final response.

### 4. Internal MCP Server

The internal MCP server is implemented in
src/mcp-server.js using the official MCP JavaScript SDK.

It exposes four tools:

1. get_learner_profile
   Retrieves a learner's longitudinal academic profile.

2. analyze_longitudinal_trends
   Identifies performance trends across academic years.

3. retrieve_evidence
   Retrieves year-by-year evidence for mathematics,
   science, language, and attendance.

4. submit_teacher_review
   Records a teacher's approval, rejection, or
   modification of a recommendation.

The internal MCP server uses synthetic learner
records stored in data/learners.json.

### 5. External MCP Integration

The system integrates a third-party Filesystem MCP
server through src/external-mcp.js.

The external server provides controlled access to
pedagogical resources in:

data/pedagogical-resources/

The agent exposes a read_pedagogical_guidance
capability that retrieves the authorized guidance
document through the external MCP connection.

The document contains principles for evidence-based
educational interpretation, cautious recommendations,
and human decision-making.

### 6. LLM and Tool Orchestration

The configured model is openai/gpt-oss-120b,
accessed through Groq's inference API.

The agent uses an iterative workflow:

1. Receive an educational analysis request.
2. Identify the learner.
3. Ask the LLM to select an appropriate tool.
4. Execute the selected MCP tool.
5. Return the tool result to the LLM.
6. Repeat tool selection when further evidence is needed.
7. Generate an evidence-based educational response.
8. Preserve the teacher's final decision-making authority.

The agent supports both internal MCP tools and
external pedagogical guidance retrieval.

### 7. Data and Evidence

The demonstration uses synthetic educational records.

Each learner profile contains longitudinal academic
information, including performance and attendance.

The system distinguishes observed evidence from
interpretation and avoids inventing missing records.

Dedicated modules provide longitudinal analysis
and evidence retrieval.

### 8. Safety, Audit and Human Oversight

The architecture includes:

- Evidence-based analysis
- Missing-data handling
- Response safety checks
- Audit logging
- Human-in-the-Loop review
- Teacher approval, modification, or rejection
- Protection against unauthorized review submissions

No consequential educational action should be
executed automatically without human review.

### 9. Evaluation

The automated test suite covers:

- Longitudinal learner analysis
- Evidence retrieval
- Audit logging
- Response safety
- Web API validation
- External MCP connectivity
- External MCP guidance retrieval

The external MCP integration has been tested
locally and observed during execution on Render.

### 10. Deployment and Demonstration

GitHub repository:
https://github.com/Keitous/EDUKAI-LONGVIEW

Live demonstration:
https://edukai-longview.onrender.com

Demonstration video:
https://youtu.be/hHK0fY73_WA

### 11. Limitations

The current prototype uses synthetic learner data
and is intended for demonstration and evaluation.

Educational recommendations are decision-support
outputs, not automated pedagogical decisions.

Further work is required before production use
with real learner information, including privacy,
access control, security, and institutional validation.

### 12. Design Principle

AI recommends. Teachers decide.
