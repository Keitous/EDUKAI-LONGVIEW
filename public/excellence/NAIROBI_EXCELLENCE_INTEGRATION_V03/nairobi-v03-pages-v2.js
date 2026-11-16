"use strict";
(() => {
  const home = document.getElementById("home-view");
  const dashboard = document.getElementById("dashboard-view");
  const main = document.querySelector("main.content");
  const api = window.NairobiV03API;
  const lang = () => document.getElementById("language-select")?.value === "en" ? "en" : "fr";
  const t = (fr,en) => lang() === "en" ? en : fr;
  const text = (node, value) => { node.textContent = String(value ?? ""); return node; };
  const el = (tag, cls, value) => { const n=document.createElement(tag); if(cls)n.className=cls; if(value!==undefined)text(n,value); return n; };
  if (!home || !dashboard || !main || !api) return;
  const pages = {
    learners:["Apprenants","Learners","Consultation des dossiers pédagogiques","Educational learner records"],
    trends:["Analyses & Tendances","Analysis & Trends","Évolution longitudinale par apprenant","Longitudinal learner progress"],
    recommendations:["Recommandations","Recommendations","Recommandations pédagogiques personnalisées","Personalized educational recommendations"],
    history:["Décisions & Historique","Decisions & History","Historique des validations humaines","Human review history"],
    reports:["Rapports","Reports","Rapports LongView générés","Generated LongView reports"],
    admin:["Session et environnement","Session & Environment","Session enseignant et environnement de démonstration","Teacher session and demonstration environment"]
  };
  const nodes={}; let current="home"; let generation=0;
  let lastReportSnapshot=null; let lastReportLearner="";
  const selector = () => document.getElementById("learner-select");
  const selected = () => selector()?.value || "";
  function message(container,fr,en){container.append(el("p","nx-muted",t(fr,en)));}
  function button(label,fn){const b=el("button","nx-button",label);b.type="button";b.addEventListener("click",fn);return b;}
  function makePage(key){
    const section=el("section","nx-page");section.id=`nx-${key}-view`;section.hidden=true;
    const header=el("header","nx-head");header.append(el("span","nx-eyebrow","EDUKAI AFRICA · LONGVIEW"),el("h2","nx-title"),el("p","nx-description"));
    const body=el("div","nx-content");section.append(header,body);main.append(section);nodes[key]={section,header,body};
  }
  Object.keys(pages).forEach(makePage);
  function title(key){const p=pages[key], n=nodes[key];text(n.header.querySelector("h2"),t(p[0],p[1]));text(n.header.querySelector("p"),t(p[2],p[3]));}
  function learnerPicker(container, onchange){
    const wrap=el("div","nx-filter");wrap.append(el("label","",t("Apprenant","Learner")));
    const select=el("select","nx-select");select.setAttribute("aria-label",t("Apprenant","Learner"));
    const options=Array.from(selector()?.options||[]);options.forEach(o=>{const copy=document.createElement("option");copy.value=o.value;copy.textContent=o.textContent;select.append(copy);});
    select.value=selected();select.addEventListener("change",()=>{if(selector()){selector().value=select.value;selector().dispatchEvent(new Event("change",{bubbles:true}));} onchange();});
    wrap.append(select);container.append(wrap);return select;
  }
  function card(container,heading){const c=el("section","nx-card");c.append(el("h3","",heading));container.append(c);return c;}
  function showError(container,error){message(container,"Chargement impossible : "+error.message,"Unable to load: "+error.message);}
  function renderTrendsNairobi(container,a){
    const records=Array.isArray(a.yearlyRecords)?a.yearlyRecords:[];
    const subjects=Array.isArray(a.subjects)?a.subjects:[];
    if(!records.length || !subjects.length){message(container,"Aucune donnée longitudinale exploitable.","No usable longitudinal data.");return;}
    const yearLabels=records.map(r=>String(r.year||""));
    const heading=el("h4","",t("Résultats par année scolaire","Results by school year"));container.append(heading);
    const scroll=el("div","");scroll.style.overflowX="auto";
    const table=el("table","");table.style.cssText="width:100%;border-collapse:collapse;text-align:left;margin:12px 0 22px;";
    const trHead=document.createElement("tr");
    [t("Matière / Indicateur","Subject / Indicator"),...yearLabels,t("Évolution","Change")].forEach(label=>{const th=el("th","",label);th.style.cssText="padding:12px;border-bottom:2px solid #dce6f4;white-space:nowrap;";trHead.append(th);});
    const thead=document.createElement("thead");thead.append(trHead);table.append(thead);
    const tbody=document.createElement("tbody");
    const metrics=[];
    subjects.forEach(s=>{
      const key=String(s.subject||"");
      const labels={mathematics:["Mathématiques","Mathematics"],science:["Sciences","Science"],language:["Langues","Languages"],attendance:["Assiduité","Attendance"]};
      const pair=labels[key];const name=pair?t(pair[0],pair[1]):String(s.label||key);
      const values=records.map(r=>{const n=Number(r[key]);return r[key]!==undefined&&r[key]!==null&&Number.isFinite(n)?n:null;});
      const first=values[0],last=values[values.length-1];
      const change=first!==null&&last!==null?last-first:null;
      const row=document.createElement("tr");
      [name,...values.map(v=>v===null?"—":String(v)),change===null?"—":(change>0?"+":"")+String(change)].forEach((value,i)=>{const td=el("td","",value);td.style.cssText="padding:12px;border-bottom:1px solid #e4ebf5;";if(i===0)td.style.fontWeight="600";row.append(td);});
      tbody.append(row);metrics.push({name,change,values});
    });
    table.append(tbody);scroll.append(table);container.append(scroll);
    container.append(el("h4","",t("Progression entre la première et la dernière année","Change from first to last year")));
    const bars=el("div","");bars.style.cssText="display:grid;gap:15px;margin:15px 0 22px;";
    metrics.forEach(m=>{
      const item=el("div","");const label=el("div","",m.name+" : "+(m.change===null?"—":(m.change>0?"+":"")+m.change));label.style.cssText="font-weight:600;margin-bottom:5px;";
      const track=el("div","");track.style.cssText="height:13px;background:#e7edf5;border-radius:10px;overflow:hidden;";
      const bar=el("div","");const pct=m.change===null?0:Math.min(100,Math.abs(m.change)/30*100);bar.style.cssText="height:100%;width:"+pct+"%;background:"+(m.change<0?"#c65c4c":"#087f95")+";border-radius:10px;";
      track.append(bar);item.append(label,track);bars.append(item);
    });container.append(bars);
    const valid=metrics.filter(m=>m.change!==null);
    if(valid.length){
      const max=valid.reduce((x,y)=>y.change>x.change?y:x);
      const min=valid.reduce((x,y)=>y.change<x.change?y:x);
      const summary=el("div","");summary.style.cssText="padding:16px;background:#f0f7fc;border:1px solid #d7e9f6;border-radius:12px;";
      summary.append(el("h4","",t("Synthèse pédagogique","Pedagogical summary")));
      summary.append(el("p","",t("Plus forte progression : ","Strongest improvement: ")+max.name+" ("+(max.change>0?"+":"")+max.change+")."));
      summary.append(el("p","",t("Progression la plus faible : ","Lowest improvement: ")+min.name+" ("+(min.change>0?"+":"")+min.change+")."));
      if(a.teacherReviewRequired)summary.append(el("p","",t("Validation humaine de l'enseignant requise.","Human teacher review required.")));
      container.append(summary);
    }
    message(container,"Données synthétiques de démonstration.","Synthetic demonstration data.");
  }
  function translatePedagogicalTextNairobi(value){
    const original=String(value??"");
    if(t("fr","en")!=="en")return original;
    // Normalize only for comparison; never change the original data.
    const norm=s=>String(s).normalize("NFC").replace(/[\u2018\u2019\u02BC]/g,"'").replace(/\u00a0/g," ").replace(/\s+/g," ").trim().toLowerCase();
    const key=norm(original);
    const known=[
      ["Valoriser les progrès en Mathématiques et identifier les pratiques pédagogiques efficaces.","Recognize progress in Mathematics and identify effective teaching practices."],
      ["Examiner avec l'enseignant les besoins éventuels de renforcement en Langues.","Review potential needs for additional language support with the teacher."],
      ["Examiner les difficultés en Mathématiques et proposer un accompagnement ciblé.","Review difficulties in Mathematics and propose targeted support."],
      ["Examiner les difficultés en Sciences et proposer un accompagnement ciblé.","Review difficulties in Science and propose targeted support."],
      ["Examiner les difficultés en Langues et proposer un accompagnement ciblé.","Review difficulties in Languages and propose targeted support."],
      ["Échanger avec l'apprenant pour comprendre les causes possibles de cette évolution.","Discuss with the learner to understand the possible reasons for this change."]
    ];
    for(const [fr,en] of known){if(key===norm(fr))return en;}
    let m=key.match(/^progression de (\d+) points?\s*,\s*la plus faible parmi les mati[eè]res analys[eé]es\.?$/);
    if(m)return `Improvement of ${m[1]} points, the smallest among the subjects analyzed.`;
    m=key.match(/^progression de (\d+) points?\.?$/);
    if(m)return `Improvement of ${m[1]} points.`;
    m=key.match(/^baisse de l'assiduit[eé] de (\d+) points?\.?$/);
    if(m)return `Attendance declined by ${m[1]} points.`;
    m=key.match(/^baisse de (\d+) points?\.?$/);
    if(m)return `Decline of ${m[1]} points.`;
    return original;
  }
  function renderRecommendationNairobi(container,item){
    const raw=String(item.subject||item.matiere||"").toLowerCase();
    const subjects={mathematics:["Mathématiques","Mathematics"],science:["Sciences","Science"],language:["Langues","Languages"],attendance:["Assiduité","Attendance"]};
    const pair=subjects[raw];
    const name=pair?t(pair[0],pair[1]):String(item.subject||item.matiere||item.id_recommandation||t("Recommandation","Recommendation"));
    const priorities={monitoring:["Suivi pédagogique","Educational monitoring"],positive:["Valorisation des progrès","Recognize progress"],high:["Priorité élevée","High priority"],medium:["Priorité moyenne","Medium priority"],low:["Priorité faible","Low priority"]};
    const priorityRaw=String(item.priority||"").toLowerCase();
    const priority=priorities[priorityRaw]?t(...priorities[priorityRaw]):String(item.priority||"");
    const block=el("article","nx-entry");block.style.cssText="padding:20px;border:1px solid #dce7f3;border-radius:12px;background:#f8fbff;margin:12px 0 16px;";
    const heading=el("h4","",name);heading.style.cssText="font-size:1.1rem;margin:0 0 12px;color:#10325d;";block.append(heading);
    if(item.observation!=null){const label=el("strong","",t("Constat pédagogique","Educational observation"));const p=el("p", "",translatePedagogicalTextNairobi(item.observation));p.style.margin="6px 0 14px";block.append(label,p);}
    if(item.action!=null){const label=el("strong","",t("Action pédagogique proposée","Proposed educational action"));const p=el("p","",translatePedagogicalTextNairobi(item.action));p.style.margin="6px 0 14px";block.append(label,p);}
    if(priority){const label=el("strong","",t("Priorité de suivi : ","Follow-up priority: "));const badge=el("span","",priority);badge.style.cssText="display:inline-block;background:#e8f4f7;color:#096d7e;padding:6px 12px;border-radius:999px;margin-left:8px;font-weight:600;";const row=el("p","");row.append(label,badge);block.append(row);}
    container.append(block);
  }
  // AH: Display-only translations for the Decisions & History page.
  // Original database values remain unchanged.
  function translateHistoryContentAH(value){
    const original=String(value??"");
    if(lang()!=="en")return original;

    const normalize=s=>String(s)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[\u2018\u2019\u02BC]/g,"'")
      .replace(/\u00a0/g," ")
      .replace(/\s+/g," ")
      .trim()
      .replace(/[.!?]+$/,"")
      .toLowerCase();

    const dictionary=[
      [
        "Échanger avec l'apprenant pour comprendre les causes possibles de cette évolution.",
        "Discuss with the learner to understand the possible reasons for this change."
      ],
      [
        "Examiner les difficultés en Langues et proposer un accompagnement ciblé.",
        "Review difficulties in Languages and propose targeted support."
      ],
      [
        "Examiner les difficultés en Sciences et proposer un accompagnement ciblé.",
        "Review difficulties in Science and propose targeted support."
      ],
      [
        "Examiner les difficultés en Mathématiques et proposer un accompagnement ciblé.",
        "Review difficulties in Mathematics and propose targeted support."
      ],
      [
        "Cette recommandation est rejetée après examen pédagogique, car elle nécessite une réévaluation des besoins réels de l'apprenante Fatoumata Barry avant toute mise en œuvre.",
        "This recommendation was rejected following a pedagogical review because the learner Fatoumata Barry's actual needs must be reassessed before any implementation."
      ]
    ];

    const key=normalize(original);

    for(const [fr,en] of dictionary){
      if(normalize(fr)===key)return en;
    }

    return translatePedagogicalTextNairobi(original);
  }
  function renderHistoryCardNairobi(container,item){
    const tr=(fr,en)=>t(fr,en);
    const str=v=>v==null?"":String(v);
    const rawStatus=str(item.decision||item.statut).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const statuses={en_attente:["En attente","Pending","#946200","#fff3d6"],approuvee:["Approuvée","Approved","#087345","#e5f7ee"],approuve:["Approuvée","Approved","#087345","#e5f7ee"],modifiee:["Modifiée","Modified","#0759a7","#e9f2ff"],modifie:["Modifiée","Modified","#0759a7","#e9f2ff"],rejetee:["Rejetée","Rejected","#a92132","#ffebed"],rejete:["Rejetée","Rejected","#a92132","#ffebed"]};
    const state=statuses[rawStatus]||[str(item.statut||item.decision),str(item.statut||item.decision),"#42526b","#edf2f8"];
    const card=el("article","nx-entry");card.style.cssText="padding:20px;border:1px solid #dce7f3;border-radius:12px;background:#f8fbff;margin:12px 0 16px;";
    const header=el("div","");header.style.cssText="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;";
    const name=el("h4","",tr("Recommandation n° ","Recommendation #")+str(item.id_recommandation||"—"));name.style.cssText="margin:0;color:#10325d;font-size:1.05rem;";
    const badge=el("span","",tr(state[0],state[1]));badge.style.cssText=`border-radius:999px;padding:6px 12px;font-weight:700;color:${state[2]};background:${state[3]};`;
    header.append(name,badge);card.append(header);
    if(item.periode_debut||item.periode_fin){const p=el("p","",tr("Période scolaire : ","School period: ")+str(item.periode_debut)+" — "+str(item.periode_fin));p.style.cssText="color:#526580;font-size:.9rem;";card.append(p);}
    const add=(fr,en,val)=>{if(val==null||String(val).trim()==="")return;const label=el("strong","",tr(fr,en));const p=el("p","",str(val));p.style.cssText="margin:6px 0 16px;line-height:1.6;overflow-wrap:anywhere;";card.append(label,p);};
    add("Constat pédagogique","Educational observation",translateHistoryContentAH(item.justification));
    add("Action pédagogique proposée","Proposed educational action",translateHistoryContentAH(item.contenu));
    add("Commentaire de l'enseignant","Teacher's comment",translateHistoryContentAH(item.commentaire));
    add("Contenu pédagogique modifié","Modified educational content",translateHistoryContentAH(item.contenu_modifie||item.contenu_pedagogique_modifie));
    const when=item.date_validation||item.date_creation;
    if(when){let display=str(when);const d=new Date(when);if(!Number.isNaN(d.getTime()))display=new Intl.DateTimeFormat(tr("fr-FR","en-GB"),{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"}).format(d)+" UTC";const foot=el("p","",tr(item.date_validation?"Décision enregistrée : ":"Recommandation créée : ",item.date_validation?"Decision recorded: ":"Recommendation created: ")+display);foot.style.cssText="border-top:1px solid #dce7f3;padding-top:12px;color:#526580;font-size:.86rem;";card.append(foot);}
    container.append(card);
  }
  function renderReportMarkdown(target, markdown){
    target.replaceChildren();
    target.style.whiteSpace="normal";

    const lines=String(markdown).replace(/\r\n?/g,"\n").split("\n");
    let index=0;

    function inline(parent,value){
      const re=/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
      let start=0;
      for(const match of value.matchAll(re)){
        if(match.index>start){
          parent.append(document.createTextNode(value.slice(start,match.index)));
        }
        const token=match[0];
        const strong=token.startsWith("**");
        const code=token.startsWith("`");
        const node=document.createElement(strong?"strong":code?"code":"em");
        node.textContent=token.slice(strong?2:1,strong?-2:-1);
        parent.append(node);
        start=match.index+token.length;
      }
      if(start<value.length){
        parent.append(document.createTextNode(value.slice(start)));
      }
    }

    function cells(line){
      return line.trim().replace(/^\|/,"").replace(/\|$/,"")
        .split("|").map(x=>x.trim());
    }

    function separator(line){
      const parts=cells(line);
      return parts.length>1 && parts.every(
        x=>/^:?-{3,}:?$/.test(x)
      );
    }

    function table(){
      const headers=cells(lines[index]);
      const table=document.createElement("table");
      table.className="nx-report-table";
      const thead=document.createElement("thead");
      const tr=document.createElement("tr");

      headers.forEach(value=>{
        const th=document.createElement("th");
        inline(th,value);
        tr.append(th);
      });

      thead.append(tr);
      table.append(thead);
      index+=2;

      const tbody=document.createElement("tbody");

      while(index<lines.length && lines[index].includes("|") &&
            lines[index].trim()){
        const tr=document.createElement("tr");
        const values=cells(lines[index]);

        headers.forEach((_,column)=>{
          const td=document.createElement("td");
          inline(td,values[column]||"");
          tr.append(td);
        });

        tbody.append(tr);
        index++;
      }

      table.append(tbody);
      target.append(table);
    }

    function isSpecial(line){
      const value=line.trim();
      return /^#{1,6}\s/.test(value) ||
        /^[-*]\s+/.test(value) ||
        /^\d+[.)]\s+/.test(value) ||
        /^-{3,}$/.test(value) ||
        /^\*{3,}$/.test(value);
    }

    while(index<lines.length){
      const value=lines[index].trim();

      if(!value){index++;continue;}

      if(index+1<lines.length &&
         value.includes("|") &&
         separator(lines[index+1])){
        table();
        continue;
      }

      const heading=value.match(/^(#{1,6})\s+(.+)$/);

      if(heading){
        const level=Math.min(heading[1].length+1,6);
        const node=document.createElement("h"+level);
        inline(node,heading[2]);
        target.append(node);
        index++;
        continue;
      }

      if(/^(-{3,}|\*{3,})$/.test(value)){
        target.append(document.createElement("hr"));
        index++;
        continue;
      }

      const listMatch=value.match(/^([-*]|\d+[.)])\s+(.+)$/);

      if(listMatch){
        const ordered=/^\d/.test(listMatch[1]);
        const list=document.createElement(ordered?"ol":"ul");

        while(index<lines.length){
          const current=lines[index].trim();
          const match=current.match(/^([-*]|\d+[.)])\s+(.+)$/);

          if(!match || /^\d/.test(match[1])!==ordered)break;

          const li=document.createElement("li");
          inline(li,match[2]);
          list.append(li);
          index++;
        }

        target.append(list);
        continue;
      }

      // Recognize section headings written entirely in bold Markdown.
      const boldHeading=value.match(/^\*\*([A-ZÀ-Ÿ][^*]+)\*\*$/);

      if(boldHeading){
        const node=document.createElement("h3");
        node.textContent=boldHeading[1];
        target.append(node);
        index++;
        continue;
      }

      const paragraph=[];
      while(index<lines.length && lines[index].trim()){
        if(paragraph.length && (
          isSpecial(lines[index]) ||
          (index+1<lines.length &&
           lines[index].includes("|") &&
           separator(lines[index+1]))
        ))break;

        paragraph.push(lines[index].trim());
        index++;
      }

      const p=document.createElement("p");
      inline(p,paragraph.join(" "));
      target.append(p);
    }
  }
  async function render(key){
    const n=nodes[key];title(key);n.body.replaceChildren();const ticket=++generation;
    if(key==="reports"){
      const pick=learnerPicker(n.body,()=>render("reports"));
      const c=card(n.body,t("Rapport LongView","LongView report"));
      const learner=pick.value;
      const language=lang();

      if(!learner){
        message(c,"Sélectionnez un apprenant.","Select a learner.");
        return;
      }

      const storageKey="edukai:nairobi:longview:v1:"+learner+":"+language;
      let saved=null;

      try{
        const raw=sessionStorage.getItem(storageKey);
        if(raw)saved=JSON.parse(raw);
      }catch(e){
        console.warn("[LongView reports] Session storage unavailable",e);
      }

      const valid=saved &&
        saved.learnerId===learner &&
        saved.language===language &&
        typeof saved.text==="string" &&
        saved.text.trim().length>0;

      if(valid){
        const printable=el("article","nx-report-print");
        printable.style.cssText="padding:20px;background:white;color:#172b45;line-height:1.65;";

        printable.append(
          el("h2","",t("Rapport d'analyse longitudinale","Longitudinal analysis report")),
          el("p","",t("Apprenant : ","Learner: ")+
  (() => {
    const option=Array.from(selector()?.options||[])
      .find(o=>o.value===learner);
    const label=String(option?.textContent||"").trim();
    const fullName=label
      .replace(/^LRN[0-9]{3,10}\s*[\u2014\u2013-]\s*/i,"")
      .trim();
    return fullName && fullName!==learner ? fullName : learner;
  })()),
el("p","",t("Identifiant : ","Learner ID: ")+learner),
          el("p","",t("Langue du rapport : Français","Report language: English"))
        );

        const body=el("div","nx-report-text");
        body.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;line-height:1.7;";

        // Preserve the original AI report text without interpreting HTML.
        renderReportMarkdown(body,saved.text);
        printable.append(body);
        c.append(printable);

        if(saved.generatedAt){
          const d=new Date(saved.generatedAt);
          if(!Number.isNaN(d.getTime())){
            c.append(el("p","nx-muted",
              t("Rapport généré : ","Report generated: ")+
              d.toLocaleString(language==="en"?"en-GB":"fr-FR")
            ));
          }
        }

        c.append(button(
          t("Imprimer / Enregistrer en PDF","Print / Save as PDF"),
          ()=>printLongViewReportAL02()
        ));
      }else{
        message(
          c,
          "Aucun rapport complet enregistré pour cet apprenant dans cette langue. Lancez une analyse LongView.",
          "No complete report saved for this learner in this language. Run a LongView analysis."
        );
      }

      c.append(button(
        t("Nouvelle analyse","New analysis"),
        ()=>{
          if(selector()){
            selector().value=learner;
            selector().dispatchEvent(new Event("change",{bubbles:true}));
          }
          const menu=document.querySelector('.navigation [data-view="home"]');
          if(menu)menu.click();
          else navigate("home");
        }
      ));
      return;
    }
    if(key==="admin"){
      const c=card(n.body,t("Session enseignant","Teacher session"));
      message(c,"Lecture de la session en cours...","Checking current session...");
      try {const s=await api.getSession();if(ticket!==generation)return;c.replaceChildren(el("h3","",t("Session enseignant","Teacher session")));message(c,s.authenticated?t("Session authentifiée","Authenticated session"):t("Session non authentifiée","Unauthenticated session"),s.authenticated?"Authenticated session":"Unauthenticated session");if(s.teacher){
  const teacher=s.teacher;
  const panel=el("div","nx-admin-teacher");
  panel.style.cssText="margin-top:18px;padding:20px;border:1px solid #dce7f3;border-radius:12px;background:#f8fbff;";

  const heading=el("h4","",t("Informations du compte enseignant","Teacher account information"));
  heading.style.cssText="margin:0 0 16px;color:#10325d;";
  panel.append(heading);

  const fields=[
    [t("Identifiant de connexion","Login identifier"),teacher.identifiant_connexion],
    [t("Rôle","Role"),teacher.role==="enseignant"?t("Enseignant","Teacher"):teacher.role],
    [t("Identifiant enseignant","Teacher ID"),teacher.id_enseignant]
  ];

  for(const [label,value] of fields){
    if(value===undefined||value===null||value==="")continue;

    const row=el("div","nx-admin-row");
    row.style.cssText="display:grid;grid-template-columns:minmax(150px,1fr) 2fr;gap:16px;padding:12px 0;border-bottom:1px solid #e1e9f3;";

    const name=el("strong","",label);
    const content=el("span","",value);

    content.style.overflowWrap="anywhere";
    row.append(name,content);
    panel.append(row);
  }

  c.append(panel);
}}catch(e){if(ticket===generation)showError(c,e);}
      const info=card(n.body,t("Périmètre de démonstration","Demonstration scope"));message(info,"Données synthétiques. Création des comptes et des dossiers reportée à une version ultérieure.","Synthetic data. Account and learner creation are deferred to a later version.");return;
    }
    if(key==="learners"){
      const c=card(n.body,t("Dossiers disponibles","Available records"));message(c,"Chargement...","Loading...");
      try{const list=await api.getLearners();if(ticket!==generation)return;c.replaceChildren(el("h3","",t("Dossiers disponibles","Available records")));for(const learner of list){const id=String(learner.id_apprenant||learner.learnerId||learner.id||"");if(!/^LRN[0-9]{3,10}$/.test(id))continue;const name=String(learner.nom_complet||learner.nom||learner.name||id);const row=el("div","nx-row");row.append(el("strong","",id+" — "+name),button(t("Analyser","Analyze"),()=>{if(selector()){selector().value=id;selector().dispatchEvent(new Event("change",{bubbles:true}));}navigate("home");}));c.append(row);}if(list.length===0)message(c,"Aucun apprenant.","No learners.");}catch(e){if(ticket===generation){c.replaceChildren();showError(c,e);}}return;
    }
    const pick=learnerPicker(n.body,()=>render(key));
    const c=card(n.body,key==="trends"?t("Évolution des résultats","Performance trends"):key==="history"?t("Décisions enregistrées","Recorded decisions"):t("Recommandations disponibles","Available recommendations"));
    if(!pick.value){message(c,"Sélectionnez un apprenant.","Select a learner.");return;}
    message(c,"Chargement...","Loading...");
    try{
      if(key==="trends"){
        const a=await api.getAnalysis(pick.value);if(ticket!==generation)return;c.replaceChildren(el("h3","",t("Évolution des résultats","Performance trends")));
        c.append(el("p","",String(a.learnerName||a.learnerId||pick.value)));
        renderTrendsNairobi(c,a);
        c.append(button(t("Voir les graphiques du tableau de bord","View dashboard charts"),()=>{const menu=document.querySelector('.navigation [data-view="dashboard"]');if(menu){menu.click();}else{navigate("dashboard");}}));
      }else if(key==="recommendations"){
        const r=await api.getRecommendations(pick.value);if(ticket!==generation)return;c.replaceChildren(el("h3","",t("Recommandations disponibles","Available recommendations")));
        const items=r.recommendations||[];if(!items.length)message(c,"Aucune recommandation.","No recommendations.");
        for(const item of items){renderRecommendationNairobi(c,item);}
        c.append(button(t("Ouvrir la validation humaine","Open human review"),openDashboardFromPage));
      }else{
        const r=await api.getReviewHistory(pick.value);if(ticket!==generation)return;c.replaceChildren(el("h3","",t("Décisions enregistrées","Recorded decisions")));
        if(!r.history.length)message(c,"Aucune décision enregistrée.","No recorded decisions.");
        for(const item of r.history){renderHistoryCardNairobi(c,item);}
        c.append(button(t("Ouvrir les actions de validation","Open review actions"),openDashboardFromPage));
      }
    }catch(e){if(ticket===generation){c.replaceChildren();showError(c,e);}}
  }
  function openDashboardFromPage(){
    // Use the original dashboard menu handler so it restores the selected
    // learner's analysis and human-review actions, not just the visible panel.
    const menu=document.querySelector('.navigation [data-view="dashboard"]');
    if(menu)menu.click();else navigate("dashboard");
  }
  function navigate(view){
    current=view;generation++;
    home.hidden=view!=="home";dashboard.hidden=view!=="dashboard";
    Object.entries(nodes).forEach(([k,n])=>n.section.hidden=k!==view);
    document.querySelectorAll(".navigation [data-view]").forEach(b=>{const active=b.dataset.view===view;b.classList.toggle("active",active);b.setAttribute("aria-current",active?"page":"false");});
    if(nodes[view])render(view);window.scrollTo(0,0);
  }
  // Capture before the legacy navigation handlers; prevent conflicting view toggles.
  document.addEventListener("click",e=>{const b=e.target.closest?.(".navigation [data-view]");if(!b)return;const view=b.dataset.view;if(view!=="home"&&view!=="dashboard"&&!nodes[view])return;if(view==="home"||view==="dashboard"){navigate(view);return;}e.stopImmediatePropagation();e.preventDefault();navigate(view);},true);
  document.getElementById("language-select")?.addEventListener("change",()=>{
    if(nodes[current])render(current);
    // The legacy report generator may update its source after the language event.
    if(current==="reports"){
      setTimeout(()=>{if(current==="reports")render("reports");},250);
      setTimeout(()=>{if(current==="reports")render("reports");},900);
    }
  });
  const reportSource=document.getElementById("longview-llm-report");
  if(reportSource && typeof MutationObserver!=="undefined"){
    let queued=false;
    new MutationObserver(()=>{
      if(current!=="reports"||queued)return;
      queued=true;
      queueMicrotask(()=>{queued=false;if(current==="reports")render("reports");});
    }).observe(reportSource,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["hidden"]});
  }
  document.querySelector(".analysis-action")?.addEventListener("click",()=>{setTimeout(()=>{if(dashboard.hidden===false && current==="home")navigate("dashboard");},250);});
  // AL-02 : impression isolee du rapport LongView.
  // Aucun changement des donnees ou du contenu original.
  function printLongViewReportAL02(){
    const report=document.querySelector("#nx-reports-view .nx-report-print");

    if(!report){
      console.error("[EDUKAI] Rapport imprimable introuvable.");
      return;
    }

    const existing=document.getElementById("edukai-print-only-al02");
    if(existing)existing.remove();

    const printRoot=document.createElement("div");
    printRoot.id="edukai-print-only-al02";

    const copy=report.cloneNode(true);
    printRoot.append(copy);

    document.body.append(printRoot);

    const cleanup=()=>{
      printRoot.remove();
      window.removeEventListener("afterprint",cleanup);
    };

    window.addEventListener("afterprint",cleanup,{once:true});

    window.print();
  }
  const nxPrintStyle=document.createElement("style");
  nxPrintStyle.textContent=`
    @media print {
      @page {
        size:A4;
        margin:16mm;
      }

      body > *:not(#edukai-print-only-al02) {
        display:none !important;
      }

      html,body {
        margin:0 !important;
        padding:0 !important;
        background:white !important;
        height:auto !important;
        min-height:0 !important;
        overflow:visible !important;
      }

      #edukai-print-only-al02 {
        display:block !important;
        position:static !important;
        width:100% !important;
        margin:0 !important;
        padding:0 !important;
      }

      #edukai-print-only-al02 .nx-report-print {
        display:block !important;
        position:static !important;
        width:100% !important;
        margin:0 !important;
        padding:0 !important;
        border:0 !important;
        box-shadow:none !important;
        background:white !important;
      }

      #edukai-print-only-al02 .nx-report-text {
        overflow:visible !important;
        white-space:normal !important;
      }

      #edukai-print-only-al02 .nx-report-text table {
        break-inside:auto;
      }

      #edukai-print-only-al02 .nx-report-text tr {
        break-inside:avoid;
      }
    }

    @media screen {
      #edukai-print-only-al02 {
        display:none !important;
      }
    }
  `;
  document.head.append(nxPrintStyle);
  const nxReportStyle=document.createElement("style");
  nxReportStyle.textContent=`
    .nx-report-text {
      font-size:15px;
      line-height:1.65;
      color:#25364b;
    }
    .nx-report-text h2,
    .nx-report-text h3,
    .nx-report-text h4 {
      color:#12385d;
      margin:22px 0 10px;
      line-height:1.3;
    }
    .nx-report-text p {
      margin:9px 0 14px;
    }
    .nx-report-text ul,
    .nx-report-text ol {
      padding-left:25px;
      margin:10px 0 18px;
    }
    .nx-report-text li {
      margin-bottom:8px;
    }
    .nx-report-text table {
      width:100%;
      border-collapse:collapse;
      margin:18px 0 24px;
      font-size:13px;
      table-layout:auto;
    }
    .nx-report-text th,
    .nx-report-text td {
      border:1px solid #ccd7e2;
      padding:9px 10px;
      text-align:left;
      vertical-align:top;
      overflow-wrap:anywhere;
    }
    .nx-report-text th {
      background:#eaf2f8;
      color:#173b5e;
      font-weight:700;
    }
    .nx-report-text tbody tr:nth-child(even) {
      background:#f7fafd;
    }
    .nx-report-text hr {
      border:0;
      border-top:1px solid #d5e0ea;
      margin:24px 0;
    }
    @media print {
      html,body {
        background:#fff !important;
      }
      .nx-report-print {
        background:#fff !important;
      }
      .nx-report-text {
        font-size:11pt !important;
        line-height:1.45 !important;
      }
      .nx-report-text table {
        font-size:9pt !important;
        margin:10px 0 14px !important;
      }
      .nx-report-text th {
        background:#f0f0f0 !important;
      }
      .nx-report-text tr,
      .nx-report-text li {
        break-inside:avoid;
      }
      .nx-report-text h2,
      .nx-report-text h3,
      .nx-report-text h4 {
        break-after:avoid;
      }
    }
  `;
  document.head.append(nxReportStyle);
  window.NairobiExcellencePages={navigate};
})();