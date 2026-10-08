# EDUKAI AFRICA – LongView Agent
## Evaluation Report (EVALS)

**Project:** EDUKAI AFRICA – LongView Agent  
**Track:** Education  
**Evaluation date:** October 8, 2026  
**Status:** Prototype evaluation using synthetic educational records

### 1. Evaluation Objectives

This evaluation assesses whether EDUKAI AFRICA – LongView Agent can:

1. Retrieve longitudinal learner records through MCP tools.
2. Identify emerging strengths, persistent difficulties, and declining academic trends.
3. Preserve evidence and uncertainty when educational data is incomplete.
4. Generate evidence-informed recommendations while maintaining human oversight.
5. Connect to an external MCP server for pedagogical guidance.
6. Connect to an LLM and support tool-based agent orchestration.
7. Reject invalid teacher-review requests and detect selected unsupported claims.
8. Maintain an auditable boundary between AI recommendations and human decisions.

The evaluation uses synthetic learner profiles. It does not establish effectiveness in real classrooms.

### 2. Technical Environment

| Component | Technology |
|---|---|
| Runtime | Node.js |
| Application | EDUKAI AFRICA – LongView Agent |
| LLM provider | Groq |
| LLM model | openai/gpt-oss-120b |
| MCP implementation | Official Model Context Protocol JavaScript SDK |
| MCP transport | Standard input/output (stdio) |
| Internal MCP server | EDUKAI LongView MCP Server |
| External MCP server | Third-party Filesystem MCP Server |
| Educational dataset | Synthetic learner records stored in JSON |
| External guidance resource | data/pedagogical-resources/guidance.txt |
| Deployment | Render |

### 3. Automated Evaluation Scenarios

The automated evaluation suite was executed using `npm test`.

| ID | Scenario | Expected behavior | Observed result |
|---|---|---|---|
| E01 | LRN001 – Emerging strengths | Detect academic improvement with high confidence | PASS |
| E02 | LRN002 – Persistent difficulties | Identify persistent learning difficulties | PASS |
| E03 | LRN003 – Declining trends | Detect declining longitudinal performance | PASS |
| E04 | LRN004 – Stable profile | Avoid generating false alerts | PASS |
| E05 | LRN005 – Missing data | Preserve uncertainty and limit confidence | PASS |
| E06 | LRN001 – Evidence retrieval | Return complete supporting evidence | PASS |
| E07 | LRN005 – Incomplete evidence | Preserve missing evidence and limited confidence | PASS |
| E08 | Audit logging | Create an audit session and record MCP actions and human-review boundaries | PASS |
| E09 | Response safety | Detect unsupported causal claims and intervention schedules | PASS |
| E10 | Web API validation | Reject invalid, mismatched, and tampered teacher-review requests | PASS |
| E11 | External MCP connection | Connect to a third-party Filesystem MCP server and retrieve guidance | PASS |
| E12 | External MCP module | Retrieve the pedagogical guidance document through the integration module | PASS |

All twelve listed evaluation areas produced passing results in the supplied test outputs.

These are grouped evaluation areas rather than twelve independently measured test cases.

### 4. Manual MCP and LLM Verification

**Internal MCP client test**

The command `node tests/test-mcp-client.js` successfully established an MCP connection, discovered four registered tools, and retrieved the longitudinal profile for learner LRN001.

The internal MCP tools are:

- `get_learner_profile`
- `analyze_longitudinal_trends`
- `retrieve_evidence`
- `submit_teacher_review`

**LLM connectivity test**

The command `node tests/test-groq.js` successfully connected to Groq using the configured `openai/gpt-oss-120b` model.

Observed response:

`EDUKAI LONGVIEW LLM READY`

**Human-in-the-loop test**

The command `node tests/test-teacher-review.js` returned a teacher-review record containing an identifier, timestamp, learner ID, recommendation, approval decision, teacher comment, and `humanReviewed: true`.

This verifies a successful review-tool response. Durable persistence after restart was not established by this test.

### 5. Detailed Longitudinal Analysis: LRN001

Learner: Aminata Camara  
Dataset: Synthetic educational records  
Observation period: Three academic years

| Metric | First value | Final value | Change | Classification |
|---|---:|---:|---:|---|
| Mathematics | 58 | 83 | +25 | Improving |
| Science | 64 | 76 | +12 | Improving |
| Language | 72 | 75 | +3 | Stable |
| Attendance | 88% | 93% | +5 percentage points | Improving |

The system correctly identified mathematics as the strongest improvement and mathematics and science as emerging strengths.

No persistent difficulties were reported for this learner.

All four metrics contained three observations and were marked as complete, with high confidence.

### 6. External MCP Integration

The external MCP integration uses a third-party Filesystem MCP server to retrieve a synthetic pedagogical guidance document.

The observed integration tests confirmed:

- Successful connection to the external MCP server.
- Discovery of available filesystem tools.
- Retrieval of the guidance document.
- Access limited to the configured pedagogical-resources directory.

A deployed agent execution on Render also showed the `read_pedagogical_guidance` tool being called successfully during an educational analysis.

This demonstrates an external MCP tool invocation within the agent workflow.

### 7. Safety and Human Oversight

The system includes safeguards intended to:

- Distinguish observed evidence from interpretation.
- Avoid inventing missing educational records.
- Detect selected unsupported causal statements.
- Detect unsupported intervention schedules.
- Require teacher review before consequential educational decisions.
- Reject certain invalid or tampered review requests.

The supplied tests demonstrate these specific safeguards, not comprehensive protection against every possible failure.

**Core principle: AI recommends. Teachers decide.**

### 8. Known Limitations and Unresolved Validation Gaps

**L01 – Limited real-world validation**

The current dataset contains synthetic educational records. The system has not yet been evaluated with real school data, teachers, or classroom outcomes.

**L02 – No demonstrated post-restart review persistence**

A teacher approval was successfully returned by the MCP tool, but the supplied test does not establish that the review survives a process or deployment restart.

**L03 – Partial automated assertion coverage**

Some standalone scripts print successful MCP or LLM responses without asserting every expected value. Their outputs have been manually inspected, but stronger regression assertions would improve reliability.

**L04 – No demonstrated robustness benchmark**

The supplied results do not establish system performance under concurrent users, external MCP outages, high latency, or large educational datasets.

**L05 – No confirmed unresolved failing test**

The provided execution logs show passing tests. No reproducible unresolved failure has been documented in the supplied evidence. A future evaluation should record a genuine failure case if one is discovered, including reproduction steps, expected behavior, observed behavior, and mitigation status.

### 9. Evaluation Improvements Planned

The next evaluation phase should include:

1. Automated assertions for all critical MCP responses.
2. Tests for teacher-review persistence and recovery after restart.
3. Failure-injection tests for unavailable LLM and external MCP services.
4. Broader evaluation of recommendation grounding and hallucination risks.
5. Larger synthetic datasets representing diverse African educational contexts.
6. Structured teacher feedback and supervised classroom pilots, subject to privacy and institutional approval.

### 10. Reproduction Commands

```bash
npm install
npm test
node tests/test-mcp-client.js
node tests/test-trends.js
node tests/test-teacher-review.js
node tests/test-groq.js
```

The Groq test requires valid LLM environment configuration and API access. The teacher-review test submits an approval and may create a review record.

### 11. Conclusion

The available test evidence supports the technical feasibility of EDUKAI AFRICA – LongView Agent as a prototype for longitudinal educational decision support.

Verified capabilities include internal MCP communication, external MCP resource retrieval, longitudinal trend analysis, evidence retrieval, LLM connectivity, and a human-review workflow.

Further work is required to establish real-world pedagogical effectiveness, operational resilience, durable review storage, and broader safety performance.

**AI recommends. Teachers decide.**