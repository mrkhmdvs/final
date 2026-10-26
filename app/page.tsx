"use client";

import { ChangeEvent, useMemo, useState } from "react";
import {
  ArrowDownToLine, ArrowUpFromLine, BarChart3, Bell, BriefcaseBusiness, Check,
  CheckCircle2, ChevronRight, CircleDollarSign, ClipboardCheck, Clock3, Download,
  FileCheck2, FileText, FolderKanban, HardHat, LayoutDashboard, MoreHorizontal,
  Paperclip, Plus, Receipt, Search, Settings, ShieldCheck, Upload, UserPlus, Users,
  Wallet, X, XCircle
} from "lucide-react";

type Section = "dashboard" | "project" | "money" | "expenses" | "expense-new" | "contracts" | "works" | "estimate" | "report" | "participants" | "settings" | "profile";
type ExpenseStatus = "Черновик" | "Отправлен" | "Принят" | "Принят частично" | "Возвращён" | "Отклонён";
type WorkStatus = "Не начат" | "В работе" | "На приёмке" | "Принят" | "Частично принят" | "С замечаниями";

type Project = { id:string; name:string; client:string; role:string; address:string; budget:number; received:number; spent:number; progress:number; status:string };
type Expense = { id:string; date:string; title:string; type:string; supplier:string; amount:number; author:string; status:ExpenseStatus; file?:string };
type Participant = { id:number; name:string; role:string; side:string; rights:string[]; invitedBy:string; status:string };
type Work = { id:number; stage:string; volume:string; amount:number; due:string; status:WorkStatus; comment?:string };

const projects: Project[] = [
  { id:"P-001", name:"ЖК Riverside — корпус A", client:"Илья Петров", role:"Прораб", address:"Ташкент, ул. Навои 18", budget:185000000, received:120000000, spent:86450000, progress:67, status:"В работе" },
  { id:"P-002", name:"Ремонт офиса Atlas", client:"Atlas Group", role:"Исполнитель", address:"Ташкент, Шота Руставели 41", budget:92000000, received:70000000, spent:51800000, progress:54, status:"В работе" },
  { id:"P-003", name:"Квартира 84 м²", client:"Саид Азимов", role:"Заказчик", address:"Ташкент, Мирзо Улугбека 7", budget:68000000, received:68000000, spent:62100000, progress:91, status:"Приёмка" }
];

const initialExpenses: Expense[] = [
  { id:"EXP-1048", date:"22 окт, 11:24", title:"Гипсокартон влагостойкий", type:"Материал", supplier:"СтройМаркет", amount:4850000, author:"Алишер К.", status:"Отправлен", file:"receipt-1048.jpg" },
  { id:"EXP-1047", date:"22 окт, 10:18", title:"Оплата бригаде — этап 2", type:"Труд", supplier:"Бригада №4", amount:7200000, author:"Рустам Н.", status:"Принят" },
  { id:"EXP-1046", date:"21 окт, 17:42", title:"Питание команды", type:"Питание", supplier:"Evos", amount:630000, author:"Алишер К.", status:"Принят" },
  { id:"EXP-1045", date:"21 окт, 15:05", title:"Кабель ВВГнг 3×2.5", type:"Материал", supplier:"ЭлектроДом", amount:2100000, author:"Марат С.", status:"Принят частично" },
  { id:"EXP-1044", date:"20 окт, 18:30", title:"Доставка материалов", type:"Другое", supplier:"Express", amount:850000, author:"Алишер К.", status:"Отклонён" }
];

const initialParticipants: Participant[] = [
  { id:1, name:"Илья Петров", role:"Клиент / заказчик", side:"Заказчик", rights:["Согласует договор", "Передаёт транши", "Принимает этапы"], invitedBy:"Алишер К.", status:"Активен" },
  { id:2, name:"Алишер К.", role:"Прораб / менеджер", side:"Исполнитель", rights:["Подотчёт", "Расходы", "Запросы денег"], invitedBy:"Илья Петров", status:"Активен" },
  { id:3, name:"Рустам Н.", role:"Подрядчик / бригада", side:"Исполнитель", rights:["Сдача работ", "Запрос аванса", "Свои расходы"], invitedBy:"Алишер К.", status:"Активен" },
  { id:4, name:"Марат С.", role:"Закупщик", side:"Исполнитель", rights:["Подотчёт на материалы", "Расходы"], invitedBy:"Алишер К.", status:"Приглашён" },
  { id:5, name:"Дилшод Р.", role:"Приёмщик работ", side:"Заказчик", rights:["Принимает этапы", "Возвращает с замечаниями"], invitedBy:"Илья Петров", status:"Активен" }
];

const initialWorks: Work[] = [
  { id:1, stage:"Черновые работы", volume:"120 м² из 300 м²", amount:7200000, due:"25 окт", status:"На приёмке" },
  { id:2, stage:"Электрика", volume:"48 точек из 80", amount:9600000, due:"30 окт", status:"В работе" },
  { id:3, stage:"Штукатурка", volume:"0 м² из 420 м²", amount:12600000, due:"5 ноя", status:"Не начат" },
  { id:4, stage:"Отделка", volume:"0 м² из 350 м²", amount:42000000, due:"20 ноя", status:"Не начат" }
];

const nav = [
  ["dashboard","Обзор",LayoutDashboard], ["project","Проекты",FolderKanban], ["money","Деньги",Wallet],
  ["expenses","Расходы",Receipt], ["contracts","Договоры",FileText], ["works","Работы и приёмка",ClipboardCheck],
  ["estimate","Смета",BarChart3], ["report","Отчётность",ShieldCheck]
] as const;

const fmt = (n:number) => new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " UZS";
const short = (n:number) => new Intl.NumberFormat("ru-RU", { notation:"compact", maximumFractionDigits:1 }).format(n);

function Status({ value }:{value:string}) {
  const cls = value.includes("Принят") ? "status status-green" : value.includes("Отклон") || value.includes("Возвращ") ? "status status-red" : value.includes("приём") || value.includes("прием") || value.includes("На провер") || value.includes("Отправ") ? "status status-orange" : "status status-blue";
  return <span className={cls}><span>●</span>{value}</span>;
}

function Metric({icon:Icon,label,value,note}:{icon:any;label:string;value:string;note:string}) {
  return <div className="card metric"><div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-note">{note}</div></div><div className="icon-box"><Icon size={18}/></div></div>;
}

function Mini({label,value}:{label:string;value:string}) { return <div className="mini"><div className="kicker">{label}</div><b>{value}</b></div>; }

export default function Home() {
  const [section, setSection] = useState<Section>("dashboard");
  const [selectedProject, setSelectedProject] = useState<Project>(projects[0]);
  const [notice, setNotice] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [works, setWorks] = useState<Work[]>(initialWorks);
  const [expense, setExpense] = useState({ title:"", type:"Материал", supplier:"", qty:"1", price:"", file:"" });
  const [moneyRequests, setMoneyRequests] = useState([{ id:1, type:"Транш", amount:25000000, purpose:"Черновые работы", status:"На рассмотрении" }, { id:2, type:"Под отчёт", amount:5000000, purpose:"Материалы", status:"Принят" }]);
  const [showInvite, setShowInvite] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("Подрядчик / бригада");

  const go = (s:Section) => { setSection(s); setNotice(""); window.scrollTo({ top:0, behavior:"smooth" }); };
  const chooseProject = (p:Project) => { setSelectedProject(p); go("project"); };
  const notify = (text:string) => { setNotice(text); setTimeout(()=>setNotice(""), 4200); };

  const createExpense = () => {
    const amount = Number(expense.qty || 1) * Number(expense.price || 0);
    if (!expense.title || !amount) { notify("Заполните наименование, количество и цену."); return; }
    const item: Expense = { id:`EXP-${1050 + expenses.length}`, date:"сейчас", title:expense.title, type:expense.type, supplier:expense.supplier || "Не указан", amount, author:"Алишер К.", status:"Отправлен", file:expense.file };
    setExpenses([item, ...expenses]); setExpense({title:"",type:"Материал",supplier:"",qty:"1",price:"",file:""}); go("expenses"); notify("Расход отправлен второй стороне на подтверждение.");
  };

  const handleFile = (e:ChangeEvent<HTMLInputElement>) => { const file=e.target.files?.[0]; if(file) setExpense(v=>({...v,file:file.name})); };
  const changeExpenseStatus = (id:string, status:ExpenseStatus) => {
    if ((status === "Отклонён" || status === "Возвращён") && !window.prompt("Комментарий обязателен:")?.trim()) { notify("Нужно указать комментарий для возврата или отклонения."); return; }
    setExpenses(items=>items.map(x=>x.id===id ? {...x,status}:x)); notify(`Расход ${id}: ${status.toLowerCase()}.`);
  };
  const acceptWork = (id:number, status:WorkStatus) => {
    if(status === "С замечаниями") { const c=window.prompt("Комментарий к замечаниям:"); if(!c?.trim()) return notify("Для замечаний нужен комментарий."); setWorks(items=>items.map(x=>x.id===id?{...x,status,comment:c}:x)); }
    else setWorks(items=>items.map(x=>x.id===id?{...x,status}:x));
    notify(status === "Принят" ? "Работа принята. Оплата начислена, прогресс обновлён." : `Работа отмечена: ${status.toLowerCase()}.`);
  };
  const invite = () => {
    if(!inviteName.trim()) return notify("Введите имя участника.");
    setParticipants([...participants,{id:Date.now(),name:inviteName,role:inviteRole,side:inviteRole.includes("Приём")?"Заказчик":"Исполнитель",rights:["По условиям проекта"],invitedBy:"Алишер К.",status:"Приглашён"}]);
    setInviteName(""); setShowInvite(false); notify(`Приглашение для ${inviteName} создано.`);
  };

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">О</div>Отчётность</div>
      <div className="nav-section">Рабочее пространство</div>
      {nav.map(([id,label,Icon]) => <button key={id} className={`nav-item ${section===id ? "active":""}`} onClick={()=>go(id)}><Icon size={17}/>{label}</button>)}
      <div className="nav-section system">Система</div>
      <button className={`nav-item ${section==="participants"?"active":""}`} onClick={()=>go("participants")}><Users size={17}/>Участники <span className="nav-count">5</span></button>
      <button className={`nav-item ${section==="settings"?"active":""}`} onClick={()=>go("settings")}><Settings size={17}/>Настройки</button>
      <div className="sidebar-bottom"><button className="user-mini" onClick={()=>go("profile")}><div className="avatar">АК</div><div><b>Алишер К.</b><span>Прораб</span></div><ChevronRight size={14}/></button></div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button className="project-switch" onClick={()=>go("project")}><BuildingIcon/><span>{selectedProject.name}</span><ChevronRight size={14}/></button>
        <div className="top-actions"><button className="icon-btn" onClick={()=>notify("У вас 3 новых уведомления.")}><Bell size={18}/><span className="notification-dot"/></button><button className="person" onClick={()=>go("profile")}><div className="avatar">АК</div><div><b>Алишер К.</b><div className="kicker">Прораб</div></div></button></div>
      </header>

      {notice && <div className="notice-wrap"><div className="notice"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice("")}><X size={15}/></button></div></div>}

      {section==="dashboard" && <Dashboard go={go} chooseProject={chooseProject} expenses={expenses}/>} 
      {section==="project" && <Project project={selectedProject} go={go}/>} 
      {section==="money" && <Money project={selectedProject} requests={moneyRequests} setRequests={setMoneyRequests} notify={notify}/>} 
      {section==="expenses" && <Expenses items={expenses} go={go} changeStatus={changeExpenseStatus}/>} 
      {section==="expense-new" && <NewExpense data={expense} setData={setExpense} create={createExpense} go={go} handleFile={handleFile}/>} 
      {section==="contracts" && <Contracts project={selectedProject} notify={notify}/>} 
      {section==="works" && <Works works={works} onAction={acceptWork} go={go}/>} 
      {section==="estimate" && <Estimate project={selectedProject} notify={notify}/>} 
      {section==="report" && <Report project={selectedProject} expenses={expenses} works={works} notify={notify}/>} 
      {section==="participants" && <Participants participants={participants} onInvite={()=>setShowInvite(true)} />} 
      {section==="settings" && <SettingsPage project={selectedProject} notify={notify}/>} 
      {section==="profile" && <Profile />} 

      {showInvite && <Modal title="Пригласить участника" onClose={()=>setShowInvite(false)}><div className="form-grid"><div className="field full"><label>Имя или название</label><input className="input" value={inviteName} onChange={e=>setInviteName(e.target.value)} placeholder="Например, Рустам Н." autoFocus/></div><div className="field full"><label>Подпись в проекте</label><select className="select" value={inviteRole} onChange={e=>setInviteRole(e.target.value)}>{["Клиент / заказчик","Генподрядчик / владелец","Партнёр","Прораб / менеджер","Подрядчик / бригада","Закупщик","Приёмщик работ"].map(x=><option key={x}>{x}</option>)}</select></div></div><div className="modal-actions"><button className="btn" onClick={()=>setShowInvite(false)}>Отмена</button><button className="btn btn-primary" onClick={invite}><UserPlus size={15}/>Создать приглашение</button></div></Modal>}
      {showProfile && <Modal title="Профиль" onClose={()=>setShowProfile(false)}><Profile compact/></Modal>}
      {showSettings && <Modal title="Настройки проекта" onClose={()=>setShowSettings(false)}><SettingsPage project={selectedProject} notify={notify} compact/></Modal>}
    </main>
  </div>;
}

function BuildingIcon(){ return <div className="tiny-brand"><BriefcaseBusiness size={14}/></div>; }

function Dashboard({go,chooseProject,expenses}:{go:(s:Section)=>void;chooseProject:(p:Project)=>void;expenses:Expense[]}) {
  return <div className="page"><div className="hero"><div><div className="eyebrow">Среда проектов · Фазы 1–2</div><h1>Доброе утро, Алишер</h1><div className="subtitle">Контроль денег, расходов и договорённостей в одном месте.</div></div><button className="btn btn-primary" onClick={()=>go("project")}><Plus size={16}/>Новый проект</button></div>
    <div className="grid grid-4"><Metric icon={CircleDollarSign} label="Денег под отчётом" value="63,4 млн UZS" note="Подтверждённые операции"/><Metric icon={Receipt} label="Расходы на проверке" value="12,7 млн UZS" note="8 операций"/><Metric icon={ArrowDownToLine} label="Ожидается от заказчиков" value="25 млн UZS" note="2 транша"/><Metric icon={ClipboardCheck} label="Этапы на приёмке" value="3" note="Нужно решение"/></div>
    <div className="grid grid-2 dashboard-lower"><div className="card"><div className="section-head"><div><h2>Мои проекты</h2><div className="subtitle">Активные объекты</div></div><button className="btn" onClick={()=>go("project")}>Все проекты <ChevronRight size={15}/></button></div><div className="project-list">{projects.map(p=><div key={p.id} className="project-card card" onClick={()=>chooseProject(p)}><div className="row-between"><div><b>{p.name}</b><div className="kicker mt">{p.client} · {p.role}</div></div><Status value={p.status}/></div><div className="progress-line"><div style={{width:`${p.progress}%`}}/></div><div className="row-between tiny"><span className="muted">Прогресс {p.progress}%</span><b>{short(p.spent)} потрачено</b></div></div>)}</div></div>
      <div className="card"><div className="section-head"><div><h2>Последние операции</h2><div className="subtitle">Из подтверждённых и ожидающих</div></div><button className="btn" onClick={()=>go("expenses")}>Все расходы</button></div><table className="table"><thead><tr><th>Операция</th><th>Сумма</th><th>Статус</th></tr></thead><tbody>{expenses.slice(0,5).map(e=><tr key={e.id}><td><b>{e.title}</b><div className="kicker">{e.date} · {e.author}</div></td><td className="money">{short(e.amount)}</td><td><Status value={e.status}/></td></tr>)}</tbody></table></div></div>
  </div>;
}

function Project({project,go}:{project:Project;go:(s:Section)=>void}) {
  return <div className="page"><div className="hero"><div><div className="eyebrow">Проект {project.id}</div><h1>{project.name}</h1><div className="subtitle">{project.address} · {project.client} · вы — {project.role}</div></div><button className="btn btn-primary" onClick={()=>go("money")}><ArrowDownToLine size={16}/>Запросить деньги</button></div>
    <div className="grid grid-4"><Metric icon={CircleDollarSign} label="Бюджет" value={short(project.budget)+" UZS"} note="По договору"/><Metric icon={ArrowDownToLine} label="Получено" value={short(project.received)+" UZS"} note="3 передачи"/><Metric icon={ArrowUpFromLine} label="Подтверждено расходов" value={short(project.spent)+" UZS"} note="42 операции"/><Metric icon={ClipboardCheck} label="Прогресс" value={`${project.progress}%`} note="8 из 12 этапов"/></div>
    <div className="grid grid-3 project-detail"><div className="card span-2"><div className="section-head"><div><h2>Финансовая картина</h2><div className="subtitle">Считается из подтверждённых операций</div></div><Status value="В работе"/></div><div className="mini-grid"><Mini label="Остаток" value="33,55 млн"/><Mini label="На проверке" value="4,85 млн"/><Mini label="Неотчитано" value="12,0 млн"/></div><div className="balance-bar"><div><span>Получено</span><b>120 млн</b></div><div><span>Подтверждено</span><b>86,45 млн</b></div><div><span>Остаток</span><b>33,55 млн</b></div></div></div><div className="card"><h2>Быстрые действия</h2><div className="quick-list"><button onClick={()=>go("expense-new")}><Receipt size={17}/>Добавить расход <ChevronRight size={14}/></button><button onClick={()=>go("works")}><ClipboardCheck size={17}/>Сдать работу <ChevronRight size={14}/></button><button onClick={()=>go("participants")}><Users size={17}/>Участники <ChevronRight size={14}/></button><button onClick={()=>go("contracts")}><FileText size={17}/>Открыть договор <ChevronRight size={14}/></button></div></div></div>
    <div className="grid grid-2"><div className="card"><div className="section-head"><div><h2>Цепочка</h2><div className="subtitle">Кто передаёт деньги и кому отчитывается</div></div></div><div className="chain"><div className="chain-node"><div className="avatar">ИП</div><div><b>Илья Петров</b><span>Заказчик</span></div></div><ChevronRight/><div className="chain-node"><div className="avatar">АК</div><div><b>Алишер К.</b><span>Прораб</span></div></div><ChevronRight/><div className="chain-node"><div className="avatar">РН</div><div><b>Рустам Н.</b><span>Бригада</span></div></div></div></div><div className="card"><div className="section-head"><div><h2>Правило «рукопожатия»</h2><div className="subtitle">Операция становится подтверждённой после решения второй стороны.</div></div><ShieldCheck size={24}/></div><div className="handshake"><CheckCircle2 size={20}/><div><b>42 операции подтверждены</b><div className="kicker">Неподтверждённые остаются на том, кто их внёс.</div></div></div></div></div>
  </div>;
}

function Money({project,requests,setRequests,notify}:{project:Project;requests:any[];setRequests:(v:any[])=>void;notify:(s:string)=>void}) {
  const [amount,setAmount]=useState("25000000"); const [purpose,setPurpose]=useState("Следующий этап работ");
  const add=()=>{const n=Number(amount); if(!n)return notify("Введите сумму."); setRequests([{id:Date.now(),type:"Транш",amount:n,purpose,status:"На рассмотрении"},...requests]); notify("Запрос на транш отправлен заказчику.");};
  return <div className="page"><div className="hero"><div><div className="eyebrow">Проект {project.id} · Деньги</div><h1>Деньги</h1><div className="subtitle">Запросы, передачи, подотчёт и остатки.</div></div><button className="btn btn-primary" onClick={add}><Plus size={16}/>Запросить транш</button></div><div className="grid grid-3"><Metric icon={Wallet} label="Получено" value="120 млн UZS" note="3 передачи"/><Metric icon={Receipt} label="Подтверждено расходов" value="86,45 млн UZS" note="42 операции"/><Metric icon={Clock3} label="Неотчитанный остаток" value="12 млн UZS" note="Перед следующим траншем"/></div><div className="grid grid-2 money-grid"><div className="card"><div className="section-head"><div><h2>Новый запрос денег</h2><div className="subtitle">Транш → этап → сумма → срок</div></div></div><div className="form-grid"><div className="field"><label>Сумма</label><input className="input" value={amount} onChange={e=>setAmount(e.target.value)} inputMode="numeric"/></div><div className="field"><label>Вид</label><select className="select"><option>Транш</option><option>Аванс</option><option>Под отчёт</option></select></div><div className="field full"><label>Назначение</label><input className="input" value={purpose} onChange={e=>setPurpose(e.target.value)}/></div></div><div className="modal-actions"><button className="btn btn-primary" onClick={add}>Отправить запрос <ArrowUpFromLine size={15}/></button></div></div><div className="card"><div className="section-head"><div><h2>Запросы</h2><div className="subtitle">История движения денег</div></div></div><table className="table"><thead><tr><th>Тип</th><th>Назначение</th><th>Сумма</th><th>Статус</th></tr></thead><tbody>{requests.map(r=><tr key={r.id}><td><b>{r.type}</b></td><td>{r.purpose}</td><td className="money">{short(r.amount)}</td><td><Status value={r.status}/></td></tr>)}</tbody></table></div></div></div>;
}

function Expenses({items,go,changeStatus}:{items:Expense[];go:(s:Section)=>void;changeStatus:(id:string,status:ExpenseStatus)=>void}) {
  const [filter,setFilter]=useState("Все"); const [query,setQuery]=useState("");
  const visible=items.filter(e=>(filter==="Все"||e.status===filter)&&e.title.toLowerCase().includes(query.toLowerCase()));
  const pending=visible.filter(e=>e.status==="Отправлен");
  return <div className="page"><div className="hero"><div><div className="eyebrow">Фаза 1 · Финансовая отчётность</div><h1>Расходы</h1><div className="subtitle">Фото чеков, статусы и подтверждение второй стороной.</div></div><button className="btn btn-primary" onClick={()=>go("expense-new")}><Plus size={16}/>Добавить расход</button></div><div className="toolbar"><div className="search"><Search size={16}/><input placeholder="Поиск по расходам" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="filters">{["Все","Отправлен","Принят","Принят частично","Возвращён","Отклонён"].map(x=><button key={x} className={`filter ${filter===x?"active":""}`} onClick={()=>setFilter(x)}>{x}</button>)}</div></div><div className="card"><div className="section-head"><div><h2>{visible.length} операций</h2><div className="subtitle">Владелец может принять выбранные или все сразу.</div></div>{pending.length>0&&<button className="btn btn-primary" onClick={()=>pending.forEach(e=>changeStatus(e.id,"Принят"))}><Check size={15}/>Принять все ожидающие</button>}</div><div className="table-wrap"><table className="table"><thead><tr><th>Операция</th><th>Тип</th><th>Поставщик</th><th>Автор</th><th>Сумма</th><th>Чек</th><th>Статус</th><th></th></tr></thead><tbody>{visible.map(e=><tr key={e.id}><td><b>{e.title}</b><div className="kicker">{e.id} · {e.date}</div></td><td><span className="chip">{e.type}</span></td><td>{e.supplier}</td><td className="muted">{e.author}</td><td className="money">{fmt(e.amount)}</td><td>{e.file?<span className="file-pill"><Paperclip size={13}/>{e.file}</span>:<span className="muted">—</span>}</td><td><Status value={e.status}/></td><td>{e.status==="Отправлен"?<div className="row-actions"><button title="Принять" onClick={()=>changeStatus(e.id,"Принят")}><Check size={15}/></button><button title="Вернуть" onClick={()=>changeStatus(e.id,"Возвращён")}><X size={15}/></button><button title="Отклонить" onClick={()=>changeStatus(e.id,"Отклонён")}><XCircle size={15}/></button></div>:<button className="icon-btn small"><MoreHorizontal size={15}/></button>}</td></tr>)}</tbody></table></div></div></div>;
}

function NewExpense({data,setData,create,go,handleFile}:{data:any;setData:(v:any)=>void;create:()=>void;go:(s:Section)=>void;handleFile:(e:ChangeEvent<HTMLInputElement>)=>void}) {
  const total=Number(data.qty||0)*Number(data.price||0);
  return <div className="page"><div className="hero"><div><div className="eyebrow">Расход · новый</div><h1>Добавить расход</h1><div className="subtitle">Операция останется у вас на подотчёте до подтверждения второй стороны.</div></div></div><div className="grid grid-2"><div className="card"><div className="form-grid"><div className="field full"><label>Наименование *</label><input className="input" placeholder="Например, гипсокартон" value={data.title} onChange={e=>setData({...data,title:e.target.value})}/></div><div className="field"><label>Тип</label><select className="select" value={data.type} onChange={e=>setData({...data,type:e.target.value})}><option>Материал</option><option>Труд</option><option>Питание</option><option>Транспорт</option><option>Другое</option></select></div><div className="field"><label>Поставщик</label><input className="input" placeholder="Название поставщика" value={data.supplier} onChange={e=>setData({...data,supplier:e.target.value})}/></div><div className="field"><label>Количество *</label><input className="input" type="number" min="1" value={data.qty} onChange={e=>setData({...data,qty:e.target.value})}/></div><div className="field"><label>Цена за единицу *</label><input className="input" type="number" value={data.price} onChange={e=>setData({...data,price:e.target.value})}/></div><div className="field full"><label>Фото / файл чека</label><label className={`upload-box ${data.file?"uploaded":""}`}><input type="file" accept="image/*,.pdf" onChange={handleFile}/><Upload size={24}/><b>{data.file||"Нажмите или перетащите файл"}</b><span>{data.file?"Файл прикреплён":"JPG, PNG, PDF · до 10 МБ"}</span></label></div></div><div className="modal-actions"><button className="btn" onClick={()=>go("expenses")}>Отмена</button><button className="btn btn-primary" onClick={create}>Отправить на подтверждение <ArrowUpFromLine size={15}/></button></div></div><div className="card preview-card"><div className="eyebrow">Предпросмотр</div><h2>Итог операции</h2><div className="preview-list"><Mini label="Наименование" value={data.title||"—"}/><Mini label="Поставщик" value={data.supplier||"—"}/><Mini label="Количество" value={data.qty||"—"}/><Mini label="Итого" value={total?fmt(total):"—"}/></div><div className="notice"><ShieldCheck size={17}/> После отправки запись появится у второй стороны. При принятии она войдёт в сквозной отчёт.</div></div></div></div>;
}

function Contracts({project,notify}:{project:Project;notify:(s:string)=>void}) {
  const [model,setModel]=useState("Под ключ + транши"); const [approved,setApproved]=useState(false);
  const models=["Фиксированная сумма","% от расходов","Зарплата","Под ключ траншами","Доля от прибыли","Сдельная оплата"];
  return <div className="page"><div className="hero"><div><div className="eyebrow">Фаза 2 · Договорённости и работы</div><h1>Договор</h1><div className="subtitle">Условия, модель оплаты, сроки, транши, работы и гарантия.</div></div><button className="btn btn-primary" onClick={()=>notify("Черновик нового договора создан.")}><Plus size={16}/>Новый договор</button></div><div className="card contract-main"><div className="row-between"><div><h2>{project.name}</h2><div className="subtitle">Заказчик: {project.client} → Исполнитель: Алишер К.</div></div><Status value={approved?"Принят":"На согласовании"}/></div><div className="grid grid-3 contract-stats"><Mini label="Стоимость договора" value="185 млн UZS"/><Mini label="Срок" value="01.10 — 30.11.2026"/><Mini label="Гарантия" value="12 месяцев"/></div><div className="field"><label>Модель оплаты</label><select className="select" value={model} onChange={e=>setModel(e.target.value)}>{models.map(x=><option key={x}>{x}</option>)}</select></div></div><div className="grid grid-2"><div className="card"><div className="section-head"><div><h2>График траншей</h2><div className="subtitle">Этап → состав работ → сумма → срок</div></div><button className="btn" onClick={()=>notify("Новый этап добавлен в график.")}><Plus size={14}/>Добавить</button></div><table className="table"><thead><tr><th>Этап</th><th>Сумма</th><th>Срок</th><th>Статус</th></tr></thead><tbody>{[["Демонтаж",25,"25 окт","Принят"],["Черновые работы",40,"5 ноя","Принят"],["Инженерия",35,"15 ноя","Ожидает"],["Отделка",55,"25 ноя","Ожидает"],["Сдача",30,"30 ноя","Ожидает"]].map(r=><tr key={r[0] as string}><td><b>{r[0]}</b></td><td>{r[1]} млн</td><td>{r[2]}</td><td><Status value={r[3] as string}/></td></tr>)}</tbody></table></div><div className="card"><div className="section-head"><div><h2>Предложение заказчику</h2><div className="subtitle">Договор + смета + график в простом виде</div></div><FileCheck2 size={21}/></div><div className="proposal"><Mini label="Стоимость" value="185 млн UZS"/><Mini label="Режим отчётности" value="По факту расходов"/><Mini label="Этапов" value="5"/><Mini label="Гарантия" value="12 месяцев"/></div><div className="modal-actions"><button className="btn" onClick={()=>notify("Предложение возвращено с комментарием.")}>Вернуть с комментарием</button><button className="btn btn-primary" onClick={()=>{setApproved(true);notify("Предложение согласовано.")}}><Check size={15}/>Согласовать</button></div></div></div><div className="card model-card"><h2>Модели оплаты</h2><div className="model-grid">{models.map(x=><button key={x} className={`model ${model===x?"selected":""}`} onClick={()=>setModel(x)}><b>{x}</b><span>Настроить параметры</span></button>)}</div></div></div>;
}

function Works({works,onAction,go}:{works:Work[];onAction:(id:number,status:WorkStatus)=>void;go:(s:Section)=>void}) {
  const pending=works.filter(x=>x.status==="На приёмке");
  return <div className="page"><div className="hero"><div><div className="eyebrow">Фаза 2 · Работы и приёмка</div><h1>Работы и приёмка</h1><div className="subtitle">Сданный объём, фото/видео, решение приёмщика и начисление оплаты.</div></div><button className="btn btn-primary" onClick={()=>go("works")}><Plus size={16}/>Сдать работу</button></div><div className="grid grid-3"><Metric icon={ClipboardCheck} label="На приёмке" value={`${pending.length}`} note="Требуют решения"/><Metric icon={HardHat} label="В работе" value="1" note="Активный этап"/><Metric icon={CircleDollarSign} label="Начислено" value="7,2 млн UZS" note="По принятому объёму"/></div><div className="card"><div className="section-head"><div><h2>Этапы проекта</h2><div className="subtitle">Приёмка полностью, частично или с замечаниями.</div></div></div><div className="work-list">{works.map(w=><div className="work-row" key={w.id}><div className="work-icon"><ClipboardCheck size={18}/></div><div className="work-main"><div className="row-between"><div><b>{w.stage}</b><div className="kicker mt">{w.volume} · срок {w.due}</div></div><Status value={w.status}/></div><div className="work-progress"><div style={{width:`${w.status==="Принят"?100:w.status==="Частично принят"?45:w.status==="На приёмке"?40:w.status==="В работе"?20:0}%`}}/></div>{w.comment&&<div className="comment">«{w.comment}»</div>}{w.status==="На приёмке"&&<div className="row-actions large"><button className="btn btn-primary" onClick={()=>onAction(w.id,"Принят")}><Check size={15}/>Принять полностью</button><button className="btn" onClick={()=>onAction(w.id,"Частично принят")}>Принять частично</button><button className="btn" onClick={()=>onAction(w.id,"С замечаниями")}>С замечаниями</button><button className="btn btn-danger" onClick={()=>onAction(w.id,"Возвращён" as WorkStatus)}><X size={15}/>Вернуть</button></div>}</div><div className="work-amount"><span>По договору</span><b>{short(w.amount)}</b></div></div>)}</div></div></div>;
}

function Estimate({project,notify}:{project:Project;notify:(s:string)=>void}) {
  const rows=[{name:"Демонтаж",kind:"Работа",qty:120,unit:"м²",cost:4500000,markup:15},{name:"Гипсокартон",kind:"Материал",qty:320,unit:"лист",cost:18500000,markup:18},{name:"Электрика",kind:"Работа",qty:80,unit:"точек",cost:9600000,markup:20},{name:"Штукатурка",kind:"Работа",qty:420,unit:"м²",cost:12600000,markup:17}];
  return <div className="page"><div className="hero"><div><div className="eyebrow">Фаза 2 · Внутренняя смета</div><h1>Смета</h1><div className="subtitle">Внутренняя версия с себестоимостью и клиентская версия без неё.</div></div><button className="btn btn-primary" onClick={()=>notify("Клиентская версия сметы сформирована.")}><FileText size={15}/>Сформировать предложение</button></div><div className="tabs"><button className="tab active">Внутренняя</button><button className="tab" onClick={()=>notify("В клиентской версии скрыты себестоимость и наценка.")}>Для заказчика</button></div><div className="card"><div className="section-head"><div><h2>{project.name}</h2><div className="subtitle">Редакция 4 · обновлено сегодня</div></div><button className="btn" onClick={()=>notify("Новая строка добавлена в смету.")}><Plus size={14}/>Добавить строку</button></div><table className="table"><thead><tr><th>Статья</th><th>Тип</th><th>Объём</th><th>Себестоимость</th><th>Наценка</th><th>Цена</th></tr></thead><tbody>{rows.map(r=>{const price=r.cost*(1+r.markup/100);return <tr key={r.name}><td><b>{r.name}</b></td><td><span className="chip">{r.kind}</span></td><td>{r.qty} {r.unit}</td><td>{fmt(r.cost)}</td><td>{r.markup}%</td><td className="money">{fmt(price)}</td></tr>})}</tbody></table><div className="estimate-total"><div><span>Себестоимость</span><b>45,2 млн UZS</b></div><div><span>Наценка</span><b>8,1 млн UZS</b></div><div><span>Цена заказчику</span><b>53,3 млн UZS</b></div></div></div></div>;
}

function Report({project,expenses,works,notify}:{project:Project;expenses:Expense[];works:Work[];notify:(s:string)=>void}) {
  const accepted=expenses.filter(x=>x.status==="Принят"||x.status==="Принят частично").reduce((s,x)=>s+x.amount,0); const workAccepted=works.filter(x=>x.status==="Принят").reduce((s,x)=>s+x.amount,0);
  return <div className="page"><div className="hero"><div><div className="eyebrow">Фаза 1 + 2 · Сквозная отчётность</div><h1>Отчёт по траншу</h1><div className="subtitle">Собирается из подтверждённых расходов и закрытых работ — без повторного ввода.</div></div><div className="hero-actions"><button className="btn" onClick={()=>notify("Подготовлен Excel-экспорт отчёта.")}><Download size={15}/>Excel</button><button className="btn" onClick={()=>notify("Подготовлен PDF-экспорт отчёта.")}><Download size={15}/>PDF</button></div></div><div className="grid grid-4"><Metric icon={CircleDollarSign} label="Транш" value="25 млн UZS" note="Этап: черновые работы"/><Metric icon={Receipt} label="Принятые расходы" value={short(accepted)+" UZS"} note={`${expenses.filter(x=>x.status.includes("Принят")).length} операции`}/><Metric icon={ClipboardCheck} label="Закрытые работы" value={short(workAccepted)+" UZS"} note="По принятому объёму"/><Metric icon={Clock3} label="Неотчитано" value="4,85 млн UZS" note="До закрытия транша"/></div><div className="grid grid-2"><div className="card"><div className="section-head"><div><h2>Раздел × тип затрат</h2><div className="subtitle">Только подтверждённые операции</div></div></div><div className="report-bars">{[["Материалы",48],["Труд",29],["Питание",8],["Транспорт",6],["Другое",9]].map(([x,v])=><div key={x as string}><div className="row-between tiny"><span>{x}</span><b>{v}%</b></div><div className="progress-line"><div style={{width:`${v}%`}}/></div></div>)}</div></div><div className="card"><div className="section-head"><div><h2>Цепочка отчёта</h2><div className="subtitle">Что уйдёт заказчику</div></div><ShieldCheck size={21}/></div><div className="timeline"><div className="timeline-item"><div className="dot"><Check size={13}/></div><div><b>Расходы подтверждены</b><div className="kicker">Чеки и суммы зафиксированы</div></div></div><div className="timeline-item"><div className="dot"><Check size={13}/></div><div><b>Работы приняты</b><div className="kicker">Объём начислен по договору</div></div></div><div className="timeline-item"><div className="dot"><Clock3 size={13}/></div><div><b>Отчёт готов к согласованию</b><div className="kicker">Заказчик видит только свой договор</div></div></div></div></div></div></div>;
}

function Participants({participants,onInvite}:{participants:Participant[];onInvite:()=>void}) {
  return <div className="page"><div className="hero"><div><div className="eyebrow">Проект · Участники и права</div><h1>Участники</h1><div className="subtitle">Роль привязана к участию в конкретном проекте, а не к аккаунту.</div></div><button className="btn btn-primary" onClick={onInvite}><UserPlus size={16}/>Пригласить</button></div><div className="card"><div className="section-head"><div><h2>Цепочка проекта</h2><div className="subtitle">Кто кого привлёк и какие права выданы.</div></div><span className="chip">{participants.length} участников</span></div><div className="participant-list">{participants.map(p=><div className="participant" key={p.id}><div className="avatar large">{p.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div className="participant-main"><div className="row-between"><div><b>{p.name}</b><div className="kicker mt">{p.role} · {p.side}</div></div><Status value={p.status}/></div><div className="rights">{p.rights.map(r=><span className="chip" key={r}>{r}</span>)}</div><div className="kicker mt">Пригласил: {p.invitedBy}</div></div><button className="icon-btn small"><MoreHorizontal size={16}/></button></div>)}</div></div></div>;
}

function SettingsPage({project,notify,compact=false}:{project:Project;notify:(s:string)=>void;compact?:boolean}) {
  return <div className={compact?"settings-compact":"page"}>{!compact&&<div className="hero"><div><div className="eyebrow">Система · Проект</div><h1>Настройки</h1><div className="subtitle">Параметры проекта, доступа и уведомлений.</div></div></div>}<div className="settings-grid"><div className="card"><h2>Основное</h2><div className="form-grid settings-form"><div className="field full"><label>Название проекта</label><input className="input" defaultValue={project.name}/></div><div className="field"><label>Валюта</label><select className="select" defaultValue="UZS"><option>UZS</option><option>USD</option></select></div><div className="field"><label>Статус</label><select className="select" defaultValue="В работе"><option>В работе</option><option>Приёмка</option><option>Завершён</option></select></div><div className="field full"><label>Адрес</label><input className="input" defaultValue={project.address}/></div></div></div><div className="card"><h2>Уведомления</h2><div className="toggle-list"><Toggle label="Новые расходы на проверке"/><Toggle label="Запросы денег"/><Toggle label="Сданные работы"/><Toggle label="Изменения договора"/></div></div><div className="card"><h2>Доступ и права</h2><div className="permission-row"><Users size={17}/><div><b>Роли участников</b><div className="kicker">Права задаются договором и участием в проекте.</div></div><ChevronRight size={15}/></div><div className="permission-row"><ShieldCheck size={17}/><div><b>Правило подтверждения</b><div className="kicker">Операции учитываются после подтверждения второй стороны.</div></div></div></div></div><button className="btn btn-primary save-settings" onClick={()=>notify("Настройки проекта сохранены.")}>Сохранить изменения</button></div>;
}

function Toggle({label}:{label:string}){ const [on,setOn]=useState(true); return <button className="toggle-row" onClick={()=>setOn(!on)}><span>{label}</span><span className={`toggle ${on?"on":""}`}><span/></span></button> }

function Profile({compact=false}:{compact?:boolean}) { return <div className={compact?"profile-compact":"page"}>{!compact&&<div className="hero"><div><div className="eyebrow">Система · Ваш аккаунт</div><h1>Профиль</h1><div className="subtitle">Ваши данные и подпись в текущем проекте.</div></div></div>}<div className="grid grid-2"><div className="card profile-card"><div className="profile-head"><div className="avatar xl">АК</div><div><h2>Алишер К.</h2><div className="subtitle">Прораб / менеджер</div><span className="chip mt">В проекте: Исполнитель</span></div></div><div className="profile-fields"><Mini label="Телефон" value="+998 ••• ••• •• 42"/><Mini label="Текущий проект" value="ЖК Riverside — корпус A"/><Mini label="Подпись" value="Прораб / менеджер"/></div><button className="btn">Изменить профиль</button></div><div className="card"><h2>Ваши права</h2><div className="rights big-rights"><span><CheckCircle2 size={16}/>Подотчёт</span><span><CheckCircle2 size={16}/>Расходы</span><span><CheckCircle2 size={16}/>Запросы денег</span><span><CheckCircle2 size={16}/>Сдача работ</span></div></div></div></div> }

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) { return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X size={17}/></button></div>{children}</div></div> }
