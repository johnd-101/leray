"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { StickyNote, Calendar, Plus, Search, Clock, MapPin, X, Sun, Moon, Trash2, Pencil, AlertCircle, CircleCheck, Bell, LogOut, Lock, Eye, EyeOff, Wifi, Users } from 'lucide-react'

const APP_EMAIL = process.env.NEXT_PUBLIC_APP_EMAIL || "admin@jtech.com";
const APP_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || "Jtech101!!";

type Theme = 'light' | 'dark'
type Priority = 'low' | 'medium' | 'high'
type Repeat = 'none' | 'daily' | 'weekly' | 'monthly'
type ApptStatus = 'confirmed' | 'pending' | 'cancelled'
type Note = { id: string; title: string; content: string; color?: string; tags: string[]; is_pinned?: boolean; pinned?: boolean }
type Appointment = { id: string; title: string; description: string; start_at: string; end_at: string; location: string; attendees: string[]; status: ApptStatus }
type Reminder = { id: string; title: string; notes: string; due_at: string; priority: Priority; repeat: Repeat; is_completed: boolean }
type Toast = { id: string; title: string; body: string; type: string }

const COLORS = ["#FFF9C4", "#E1F5FE", "#E8F5E9", "#FCE4EC", "#F3E5F5", "#FFF3E0"]

function toLocalInput(isoStr: string) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function fromLocalInput(local: string) {
  return local? new Date(local).toISOString() : new Date().toISOString()
}
function safeTags(t: any): string[] {
  if (Array.isArray(t)) return t
  if (typeof t === 'string') {
    try { const p = JSON.parse(t); if (Array.isArray(p)) return p } catch {}
    return t.split(',').map((s:string)=>s.trim()).filter(Boolean)
  }
  return []
}

// PULSING CONNECTED INDICATOR
function ConnectedIndicator({ theme }: { theme: Theme }) {
  const [online, setOnline] = useState<boolean | null>(null)
  const check = useCallback(async () => {
    try {
      const r = await fetch('/api/notes', { method: 'HEAD', cache: 'no-store' })
      setOnline(r.ok)
    } catch { setOnline(false) }
  }, [])
  useEffect(() => { check(); const id = setInterval(check, 15000); return () => clearInterval(id) }, [check])
  return (
    <div className={theme==='dark'? 'flex items-center gap-2.5 px-4 py-2 rounded-full text- font-bold border border-white/10 bg-white/5 backdrop-blur' : 'flex items-center gap-2.5 px-4 py-2 rounded-full text- font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'}>
      <span className="relative flex h-2.5 w-2.5">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${online===null? 'bg-gray-400' : online? 'bg-emerald-400' : 'bg-red-400'}`}></span>
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${online===null? 'bg-gray-400' : online? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]' : 'bg-red-500'}`}></span>
      </span>
      <Wifi size={12} />
      {online===null? 'Checking...' : online? 'Connected' : 'Offline'}
    </div>
  )
}

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<Theme>('light')
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)
  const [loginEmail, setLoginEmail] = useState(APP_EMAIL)
  const [loginPass, setLoginPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{type:string,id:string}|null>(null)
  const [rForm, setRForm] = useState({ title: '', notes: '', due_at: '', priority: 'medium' as Priority, repeat: 'none' as Repeat })
  const [aForm, setAForm] = useState({ title: '', description: '', start_at: '', end_at: '', location: '', attendees: '', status: 'confirmed' as ApptStatus })
  const [nForm, setNForm] = useState({ title: '', content: '', color: COLORS[1], is_pinned: false, tags: '' })
  const [aError, setAError] = useState(''); const [nError, setNError] = useState(''); const [rError, setRError] = useState('')
  const [savingNote, setSavingNote] = useState(false); const [savingAppt, setSavingAppt] = useState(false); const [savingReminder, setSavingReminder] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [debugInfo, setDebugInfo] = useState('')
  const isDark = theme === 'dark'

  const addToast = useCallback((title: string, body: string, type: string = 'info') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, title, body, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id!== id)), 8000)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark')
    const raw = localStorage.getItem('qs_auth')
    if (raw) { try { const d = JSON.parse(raw); setUserEmail(d.email); setIsAuthed(true) } catch { setIsAuthed(false) } } else setIsAuthed(false)
    setMounted(true)
  }, [])

  const handleLogin = () => {
    setLoginError(''); setLoginLoading(true)
    setTimeout(() => {
      if (loginEmail.toLowerCase() === APP_EMAIL.toLowerCase() && loginPass === APP_PASSWORD) {
        localStorage.setItem('qs_auth', JSON.stringify({ email: loginEmail, at: Date.now() }))
        setUserEmail(loginEmail); setIsAuthed(true)
      } else setLoginError('Invalid credentials')
      setLoginLoading(false)
    }, 400)
  }

  const loadData = async () => {
    if (!isAuthed) return
    setLoading(true)
    try {
      const [nRes, aRes, rRes] = await Promise.all([fetch('/api/notes'), fetch('/api/appointments'), fetch('/api/reminders')])
      if (nRes.ok) { const raw = await nRes.json(); const list = Array.isArray(raw)? raw : raw.notes || raw.data || []; setNotes(list.map((n:any)=>({...n, tags: safeTags(n.tags), color: n.color||COLORS[0], is_pinned:!!(n.is_pinned||n.pinned)}))) }
      if (aRes.ok) { const d = await aRes.json(); const list = Array.isArray(d)? d : d.data || []; setAppointments(list.map((a:any)=>({...a, attendees: safeTags(a.attendees)}))) }
      if (rRes.ok) { const d = await rRes.json(); setReminders(Array.isArray(d)? d : d.data || []) }
    } finally { setLoading(false) }
  }
  useEffect(() => { if (mounted && isAuthed) loadData() }, [mounted, isAuthed])

  const showNotification = useCallback((title: string, body: string, type: string = 'reminder') => {
    addToast(title, body, type)
    if ('Notification' in window) {
      if (Notification.permission === 'granted') { new Notification(title, { body } as any) }
      else if (Notification.permission!== 'denied') { Notification.requestPermission().then(p => { if (p === 'granted') new Notification(title, { body } as any) }) }
    }
  }, [addToast])

  useEffect(() => { if (!mounted ||!isAuthed) return; if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission() }, [mounted, isAuthed])

  const triggerTest = useCallback(() => { showNotification('Test OK', 'Test at ' + new Date().toLocaleTimeString(), 'test') }, [showNotification])

  useEffect(() => {
    if (!isAuthed) return
    const check = () => {
      const now = new Date()
      setDebugInfo('Check ' + now.toLocaleTimeString() + ' - ' + reminders.length + ' reminders')
      reminders.forEach(r => {
        if (r.is_completed) return
        const due = new Date(r.due_at)
        const diff = now.getTime() - due.getTime()
        if (diff >= -5000 && diff < 60000) {
          const key = 'notified_' + r.id + '_' + due.getHours() + '_' + due.getMinutes()
          if (localStorage.getItem(key)) return
          showNotification('Reminder: ' + r.title, r.notes || 'Due now!', 'reminder')
          localStorage.setItem(key, '1')
        }
      })
    }
    check(); const id = setInterval(check, 5000); return () => clearInterval(id)
  }, [reminders, isAuthed, showNotification])

  const saveNote = async () => {
    if (!nForm.title.trim() &&!nForm.content.trim()) { setNError('Required'); return }
    setSavingNote(true)
    const payload = { title: nForm.title || 'Untitled', content: nForm.content, color: nForm.color, tags: nForm.tags.split(',').map(s=>s.trim()).filter(Boolean), is_pinned: nForm.is_pinned }
    try {
      const url = editingNote? '/api/notes/' + editingNote.id : '/api/notes'
      const res = await fetch(url, { method: editingNote? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json(); if (!res.ok) throw new Error(data.error)
      if (editingNote) setNotes(ns => ns.map(x => x.id === editingNote.id? {...x,...data, tags: safeTags(data.tags)} : x))
      else setNotes(ns => [{...data, tags: safeTags(data.tags)},...ns])
      setNoteModalOpen(false); setEditingNote(null)
    } catch (e:any) { setNError(e.message) } finally { setSavingNote(false) }
  }

  const saveAppointment = async () => {
    if (!aForm.title.trim()) { setAError('Title required'); return }
    if (aForm.start_at && aForm.end_at && new Date(aForm.end_at) <= new Date(aForm.start_at)) { setAError('End must be after start'); return }
    setSavingAppt(true); setAError('')
    const payload = { title: aForm.title, description: aForm.description, start_at: fromLocalInput(aForm.start_at), end_at: fromLocalInput(aForm.end_at), location: aForm.location, attendees: aForm.attendees.split(',').map(s=>s.trim()).filter(Boolean), status: aForm.status }
    try {
      const url = editingAppointment? '/api/appointments/' + editingAppointment.id : '/api/appointments'
      const res = await fetch(url, { method: editingAppointment? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json(); if (!res.ok) throw new Error(data.error)
      if (editingAppointment) setAppointments(as => as.map(x => x.id === data.id? data : x)); else setAppointments(as => [data,...as])
      setAppointmentModalOpen(false); setEditingAppointment(null)
      addToast(editingAppointment? 'Appointment updated' : 'Appointment created', payload.title, 'info')
    } catch (e:any) { setAError(e.message) } finally { setSavingAppt(false) }
  }

  const saveReminder = async () => {
    if (!rForm.title.trim()) { setRError('Required'); return }
    if (!rForm.due_at) { setRError('Date required'); return }
    setSavingReminder(true)
    const payload = { title: rForm.title, notes: rForm.notes, due_at: fromLocalInput(rForm.due_at), priority: rForm.priority, repeat: rForm.repeat, is_completed: false }
    try {
      const url = editingReminder? '/api/reminders/' + editingReminder.id : '/api/reminders'
      const res = await fetch(url, { method: editingReminder? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json(); if (!res.ok) throw new Error(data.error)
      if (editingReminder) setReminders(rs => rs.map(x => x.id === data.id? data : x)); else setReminders(rs => [data,...rs])
      setReminderModalOpen(false); setEditingReminder(null)
      addToast('Reminder set', 'Due ' + new Date(payload.due_at).toLocaleString(), 'reminder')
    } catch (e:any) { setRError(e.message) } finally { setSavingReminder(false) }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await fetch('/api/' + deleteTarget.type + 's/' + deleteTarget.id, { method: 'DELETE' })
    if (deleteTarget.type === 'note') setNotes(ns => ns.filter(x => x.id!== deleteTarget.id))
    if (deleteTarget.type === 'appointment') setAppointments(as => as.filter(x => x.id!== deleteTarget.id))
    if (deleteTarget.type === 'reminder') setReminders(rs => rs.filter(x => x.id!== deleteTarget.id))
    setDeleteTarget(null)
    addToast('Deleted', deleteTarget.type + ' removed', 'info')
  }

  const filteredNotes = useMemo(() => {
    const q = search.toLowerCase()
    let list = notes
    if (q) list = list.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
    return [...list].sort((a,b) => Number(!!(b.is_pinned||b.pinned)) - Number(!!(a.is_pinned||a.pinned)))
  }, [notes, search])

  const filteredAppointments = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return appointments
    return appointments.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.location.toLowerCase().includes(q))
  }, [appointments, search])

  if (!mounted || isAuthed === null) return <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#070A14] via-[#10132A] to-[#1E1B4B] text-white">Loading...</div>

  if (!isAuthed) {
    return (
      <div className={isDark? 'min-h-screen grid place-items-center p-4 bg-gradient-to-br from-[#070A14] via-[#10132A] to-[#1E1B4B] text-white' : 'min-h-screen grid place-items-center p-4 bg-gradient-to-br from-indigo-100 via-white to-fuchsia-100'}>
        <div className={isDark? 'w-[90%] md:w-[40%] max-w- rounded- border border-white/10 bg-gradient-to-br from-[#151821]/90 to-[#1C1F2B]/90 backdrop-blur-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]' : 'w-[90%] md:w-[40%] max-w- rounded- border border-white/60 bg-white/90 backdrop-blur-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)]'}>
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 rounded-full mb-6"/>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 grid place-items-center text-white shadow-lg"><Lock size={20}/></div>
            <div>
              <h1 className="font-black text-2xl tracking-tight">QuickStack</h1>
              <p className="text-xs opacity-60">40% width • Dark gradient</p>
            </div>
          </div>
          {loginError && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-2xl mb-4">{loginError}</div>}
          <div className="space-y-4">
            <div>
              <label className="text- font-bold opacity-60 ml-1">Email</label>
              <input value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} className={isDark? 'w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white mt-1' : 'w-full h-12 rounded-2xl border px-4 mt-1'} placeholder="Email" />
            </div>
            <div>
              <label className="text- font-bold opacity-60 ml-1">Password</label>
              <div className="relative mt-1">
                <input type={showPass? 'text' : 'password'} value={loginPass} onChange={e=>setLoginPass(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleLogin()} className={isDark? 'w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 pr-12 text-white' : 'w-full h-12 rounded-2xl border px-4 pr-12'} placeholder="Password" />
                <button onClick={()=>setShowPass(!showPass)} className="absolute right-2 top-2 w-8 h-8 grid place-items-center rounded-full bg-white/10 cursor-pointer"><Eye size={14}/></button>
              </div>
            </div>
            <button onClick={handleLogin} className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white cursor-pointer font-bold shadow-lg">{loginLoading? 'Checking...' : 'Sign in'}</button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#070A14] via-[#10132A] to-[#1E1B4B] text-white">Loading data...</div>

  const pageBg = isDark? 'min-h-screen p-6 bg-gradient-to-br from-[#070A14] via-[#10132A] to-[#1E1B4B] text-white' : 'min-h-screen p-6 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 text-[#111827]'
  const cardBase = isDark? 'rounded- p-6 bg-gradient-to-br from-[#151821]/80 to-[#1C1F2B]/80 border border-white/10 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)]' : 'rounded- p-6 bg-white/80 border border-white/60 shadow-xl backdrop-blur-xl'
  const headerBase = isDark? 'rounded- p-6 bg-gradient-to-br from-[#151821]/90 to-[#1E1B4B]/60 border border-white/10 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex justify-between items-center mb-6' : 'rounded- p-6 bg-white/80 border border-white/60 shadow-xl backdrop-blur-xl flex justify-between items-center mb-6'
  const inputBase = isDark? 'w-full h-11 rounded-2xl px-4 bg-white/5 border border-white/10 text-white placeholder:text-white/40' : 'w-full h-11 rounded-2xl px-4 bg-white border border-gray-200'

  return (
    <div className={pageBg}>
      <div className="max-w-6xl mx-auto">
        <div className={headerBase}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 grid place-items-center text-white shadow-lg"><CircleCheck size={18}/></div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">QuickStack</h1>
              <p className="text-xs opacity-50">{userEmail}</p>
            </div>
            <ConnectedIndicator theme={theme}/>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={triggerTest} className="px-4 h-10 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/20 text-amber-300 text-xs font-bold cursor-pointer flex items-center gap-1"><Bell size={14}/>Test</button>
            <button onClick={()=>setTheme(t=>t==='light'?'dark':'light')} className={isDark? 'w-10 h-10 rounded-2xl border border-white/10 bg-white/5 grid place-items-center cursor-pointer' : 'w-10 h-10 rounded-2xl border bg-white grid place-items-center cursor-pointer'}>{isDark? <Sun size={16}/> : <Moon size={16}/>}</button>
            <button onClick={()=>{localStorage.removeItem('qs_auth'); setIsAuthed(false)}} className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 grid place-items-center cursor-pointer"><LogOut size={16}/></button>
          </div>
        </div>

        <div className={isDark? 'mb-4 p-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 text-xs font-mono backdrop-blur flex justify-between' : 'mb-4 p-3 rounded-2xl bg-black text-white text-xs font-mono flex justify-between'}>
          <span>DEBUG: {debugInfo} | {reminders.length} reminders</span>
          <span className="flex items-center gap-2"><ConnectedIndicator theme={theme}/></span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={cardBase}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold flex items-center gap-2"><StickyNote size={16} className="text-indigo-400"/>Notes ({filteredNotes.length})</h2>
              <button onClick={()=>{setEditingNote(null); setNForm({title:'', content:'', color: COLORS[1], is_pinned: false, tags: ''}); setNoteModalOpen(true)}} className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white text-xs cursor-pointer flex items-center gap-1"><Plus size={12}/>New</button>
            </div>
            <div className="space-y-2">
              {filteredNotes.map(n=>(
                <div key={n.id} className={isDark? 'rounded-2xl p-3 border border-white/5 bg-white/5' : 'rounded-2xl p-3 border bg-white'} style={{background: isDark? undefined : n.color}}>
                  <div className="flex justify-between"><span className="font-semibold text-sm">{n.title}</span><div className="flex gap-1"><button onClick={()=>{setEditingNote(n); setNForm({title:n.title, content:n.content, color:n.color||COLORS[0], is_pinned:!!(n.is_pinned||n.pinned), tags:(n.tags||[]).join(', ')}); setNoteModalOpen(true)}} className="w-6 h-6 grid place-items-center rounded-full hover:bg-white/10 cursor-pointer"><Pencil size={10}/></button><button onClick={()=>setDeleteTarget({type:'note', id:n.id})} className="w-6 h-6 grid place-items-center rounded-full hover:bg-red-500/20 cursor-pointer"><Trash2 size={10}/></button></div></div>
                  <p className="text-xs opacity-60 mt-1">{n.content.slice(0,100)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={cardBase}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold flex items-center gap-2"><Calendar size={16} className="text-fuchsia-400"/>Appointments ({filteredAppointments.length})</h2>
              <button onClick={()=>{const now=new Date(); setAForm({title:'', description:'', start_at: toLocalInput(now.toISOString()), end_at: toLocalInput(new Date(now.getTime()+3600000).toISOString()), location:'', attendees:'', status:'confirmed'}); setAppointmentModalOpen(true)}} className="px-3 py-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white text-xs cursor-pointer flex items-center gap-1"><Plus size={12}/>New</button>
            </div>
            <div className="space-y-3">
              {filteredAppointments.length===0 && <p className="text-xs opacity-50 text-center py-6">No appointments yet</p>}
              {filteredAppointments.map(a=>(
                <div key={a.id} className={isDark? 'group p-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition' : 'group p-3 rounded-2xl border bg-white/70 hover:bg-white transition'}>
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white grid place-items-center text- font-bold shrink-0 text-center leading-tight">
                      {new Date(a.start_at).toLocaleDateString(undefined,{month:'short'})}<br/>{new Date(a.start_at).getDate()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{a.title}</p>
                      <p className="text-xs opacity-60 flex items-center gap-1 mt-0.5"><Clock size={10}/>{new Date(a.start_at).toLocaleString()}</p>
                      {a.location && <p className="text-xs opacity-60 flex items-center gap-1"><MapPin size={10}/>{a.location}</p>}
                      {a.attendees?.length>0 && <p className="text-xs opacity-50 flex items-center gap-1"><Users size={10}/>{a.attendees.join(', ')}</p>}
                      <p className={`text- mt-1 inline-block px-2 py-0.5 rounded-full ${a.status==='confirmed'?'bg-emerald-500/20 text-emerald-400' : a.status==='pending'?'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>{a.status}</p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={()=>{setEditingAppointment(a); setAForm({title:a.title, description:a.description||'', start_at: toLocalInput(a.start_at), end_at: toLocalInput(a.end_at), location:a.location||'', attendees:(a.attendees||[]).join(', '), status:a.status}); setAppointmentModalOpen(true)}} className="w-7 h-7 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"><Pencil size={12}/></button>
                      <button onClick={()=>setDeleteTarget({type:'appointment', id:a.id})} className="w-7 h-7 grid place-items-center rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"><Trash2 size={12}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cardBase}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold flex items-center gap-2"><Bell size={16} className="text-emerald-400"/>Reminders ({reminders.length})</h2>
              <button onClick={()=>{setRForm({title:'', notes:'', due_at: toLocalInput(new Date().toISOString()), priority:'medium', repeat:'none'}); setReminderModalOpen(true)}} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-xs cursor-pointer">+ New</button>
            </div>
            <div className="space-y-2">
              {reminders.map(r=>{
                const diff = new Date(r.due_at).getTime() - Date.now()
                const label = diff > 0? 'in ' + Math.round(diff/1000) + 's' : 'DUE'
                return (
                  <div key={r.id} className={isDark? 'p-3 rounded-2xl border border-white/5 bg-white/5 border-l-4' : 'p-3 rounded-2xl border-l-4 bg-white/50'} style={{borderLeftColor: r.priority==='high'? '#ef4444' : r.priority==='medium'? '#f59e0b' : '#10b981'}}>
                    <p className="font-medium text-sm">{r.title}</p>
                    <p className="text-xs opacity-60">{new Date(r.due_at).toLocaleString()} - {label}</p>
                    <div className="flex gap-1 mt-1"><button onClick={()=>{setEditingReminder(r); setRForm({title:r.title, notes:r.notes, due_at: toLocalInput(r.due_at), priority:r.priority, repeat:r.repeat}); setReminderModalOpen(true)}} className="text-xs px-2 py-1 rounded-full bg-white/10 cursor-pointer">Edit</button><button onClick={()=>setDeleteTarget({type:'reminder', id:r.id})} className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 cursor-pointer">Del</button></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setNoteModalOpen(false)}/><div className={isDark? 'relative bg-gradient-to-br from-[#151821] to-[#1C1F2B] border border-white/10 rounded- p-6 w-full max-w-md' : 'relative bg-white rounded- p-6 w-full max-w-md'}><h3 className="font-bold mb-3">Note</h3><input value={nForm.title} onChange={e=>setNForm({...nForm, title:e.target.value})} placeholder="Title" className={inputBase + ' mb-2'}/><textarea value={nForm.content} onChange={e=>setNForm({...nForm, content:e.target.value})} rows={4} className={isDark? 'w-full rounded-2xl border border-white/10 bg-white/5 p-3 mb-2 text-white' : 'w-full rounded-2xl border p-3 mb-2'}/><div className="flex justify-end gap-2"><button onClick={()=>setNoteModalOpen(false)} className="h-10 px-4 rounded-2xl border border-white/10 cursor-pointer">Cancel</button><button onClick={saveNote} className="h-10 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white cursor-pointer">{savingNote? 'Saving...' : 'Save'}</button></div></div></div>
      )}

      {appointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setAppointmentModalOpen(false)}/>
          <div className={isDark? 'relative bg-gradient-to-br from-[#151821] to-[#1C1F2B] border border-white/10 rounded- p-6 w-full max-w-md shadow-2xl max-h- overflow-y-auto' : 'relative bg-white rounded- p-6 w-full max-w-md shadow-2xl max-h- overflow-y-auto'}>
            <h3 className="font-bold mb-3">{editingAppointment? 'Edit Appointment' : 'New Appointment'}</h3>
            {aError && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-xl mb-2">{aError}</div>}
            <input value={aForm.title} onChange={e=>setAForm({...aForm, title:e.target.value})} placeholder="Title *" className={inputBase + ' mb-2'}/>
            <textarea value={aForm.description} onChange={e=>setAForm({...aForm, description:e.target.value})} placeholder="Description" rows={2} className={isDark? 'w-full rounded-2xl border border-white/10 bg-white/5 p-3 mb-2 text-white' : 'w-full rounded-2xl border p-3 mb-2'}/>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div><label className="text- opacity-60 ml-1">Start</label><input type="datetime-local" value={aForm.start_at} onChange={e=>setAForm({...aForm, start_at:e.target.value})} className={inputBase}/></div>
              <div><label className="text- opacity-60 ml-1">End</label><input type="datetime-local" value={aForm.end_at} onChange={e=>setAForm({...aForm, end_at:e.target.value})} className={inputBase}/></div>
            </div>
            <input value={aForm.location} onChange={e=>setAForm({...aForm, location:e.target.value})} placeholder="Location" className={inputBase + ' mb-2'}/>
            <input value={aForm.attendees} onChange={e=>setAForm({...aForm, attendees:e.target.value})} placeholder="Attendees (comma separated emails)" className={inputBase + ' mb-2'}/>
            <select value={aForm.status} onChange={e=>setAForm({...aForm, status: e.target.value as ApptStatus})} className={inputBase + ' mb-4 cursor-pointer'}>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex justify-end gap-2"><button onClick={()=>setAppointmentModalOpen(false)} className="h-10 px-4 rounded-2xl border border-white/10 cursor-pointer">Cancel</button><button onClick={saveAppointment} disabled={savingAppt} className="h-10 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white cursor-pointer disabled:opacity-50">{savingAppt? 'Saving...' : editingAppointment? 'Update' : 'Create'}</button></div>
          </div>
        </div>
      )}

      {reminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setReminderModalOpen(false)}/><div className={isDark? 'relative bg-gradient-to-br from-[#151821] to-[#1C1F2B] border border-white/10 rounded- p-6 w-full max-w-md' : 'relative bg-white rounded- p-6 w-full max-w-md'}><h3 className="font-bold mb-3">Reminder</h3>{rError && <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded-xl mb-2">{rError}</div>}<input value={rForm.title} onChange={e=>setRForm({...rForm, title:e.target.value})} placeholder="Title" className={inputBase + ' mb-2'}/><input type="datetime-local" value={rForm.due_at} onChange={e=>setRForm({...rForm, due_at:e.target.value})} className={inputBase + ' mb-2'}/><div className="flex justify-end gap-2"><button onClick={()=>setReminderModalOpen(false)} className="h-10 px-4 rounded-2xl border border-white/10 cursor-pointer">Cancel</button><button onClick={saveReminder} className="h-10 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white cursor-pointer">Save</button></div></div></div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setDeleteTarget(null)}/><div className={isDark? 'relative bg-gradient-to-br from-[#151821] to-[#1C1F2B] border border-white/10 rounded- p-6 w-full max-w-sm' : 'relative bg-white rounded- p-6 w-full max-w-sm'}><p className="mb-4">Delete this {deleteTarget.type}?</p><div className="flex justify-end gap-2"><button onClick={()=>setDeleteTarget(null)} className="h-10 px-4 rounded-2xl border border-white/10 cursor-pointer">Cancel</button><button onClick={confirmDelete} className="h-10 px-4 rounded-2xl bg-red-600 text-white cursor-pointer">Delete</button></div></div></div>
      )}

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-[90%] max-w- pointer-events-none">
        {toasts.map(t=>(
          <div key={t.id} className={isDark? 'pointer-events-auto rounded- border border-white/10 bg-gradient-to-br from-[#1C1F2B]/90 to-[#151821]/90 backdrop-blur-xl p-4 shadow-2xl flex gap-3' : 'pointer-events-auto rounded- border bg-white p-4 shadow-xl flex gap-3'}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 grid place-items-center text-white"><Bell size={14}/></div><div className="flex-1"><p className="text-sm font-bold">{t.title}</p><p className="text-xs opacity-70">{t.body}</p></div><button onClick={()=>setToasts(prev=>prev.filter(x=>x.id!==t.id))} className="w-6 h-6 grid place-items-center rounded-full bg-white/10 cursor-pointer"><X size={12}/></button>
          </div>
        ))}
      </div>
    </div>
  )
}
