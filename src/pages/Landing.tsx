import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

type Lang = 'id' | 'en'

type Msg = { side: 'in' | 'out'; text: string }
type UseCase = { key: string; label: string; name: string; chat: Msg[] }
type Plan = { name: string; m: number; a: number; items: string[]; featured?: boolean }
interface LangCopy {
  nav: { solusi: string; cara: string; harga: string; bantuan: string; masuk: string }
  hero: { eyebrow: string; title1: string; title2: string; sub: string; cta: string; learn: string; badge: string; heroChat: Msg[] }
  how: { eyebrow: string; title: string; steps: { n: string; t: string; d: string }[] }
  arthur: { eyebrow: string; title1: string; title2: string; body: string; role: string; cta: string; chat: Msg[] }
  solusi: { eyebrow: string; title: string; sub: string; bullets: string[]; heading: (n: string, l: string) => string; body: string }
  testimonial: { eyebrow: string; title: string; items: { q: string; a: string; r: string }[] }
  pricing: { eyebrow: string; title: string; sub: string; monthly: string; annual: string; per: string; startFree: string; pick: string; plans: Plan[]; popular: string }
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] }
  cta: { title: string; sub: string; btn: string }
  footer: { clevio: string; dukungan: string; perusahaan: string; legal: string; copyright: string; systems: string; links: Record<string, string> }
  useCases: UseCase[]
}

const COPY: Record<Lang, LangCopy> = {
  id: {
    nav: { solusi: 'Solusi', cara: 'Cara kerja', harga: 'Harga', bantuan: 'Bantuan', masuk: 'Masuk' },
    hero: {
      eyebrow: 'Diperkenalkan',
      title1: 'Asisten AI di',
      title2: 'WhatsApp Anda.',
      sub: 'Menjawab pelanggan, mengatur jadwal, mengurus hal kecil — sepanjang hari. Siap dalam lima menit.',
      cta: 'Mulai gratis',
      learn: 'Pelajari lebih lanjut',
      badge: 'Aktif sekarang',
      heroChat: [
        { side: 'in', text: 'Halo, masih buka?' },
        { side: 'out', text: 'Halo Kak! Buka 24 jam 😊 Ada yang bisa dibantu?' },
        { side: 'in', text: 'Mau pesan kue ulang tahun untuk besok.' },
        { side: 'out', text: 'Bisa Kak. Ukuran berapa & rasa apa?' },
        { side: 'in', text: '20cm, cokelat.' },
        { side: 'out', text: 'Siap dicatat! Mau diantar atau diambil?' },
      ],
    },
    how: {
      eyebrow: 'Cara kerja', title: 'Lima menit, lalu selesai.',
      steps: [
        { n: '01', t: 'Ngobrol dengan Arthur', d: 'Ceritakan bisnis Anda dengan bahasa sendiri. Arthur merangkai semuanya.' },
        { n: '02', t: 'Hubungkan WhatsApp', d: 'Scan QR satu kali. Nomor Anda langsung dijaga AI.' },
        { n: '03', t: 'AI mulai bekerja', d: 'Pelanggan dibalas otomatis dengan gaya bicara Anda.' },
      ],
    },
    arthur: {
      eyebrow: 'Arthur', title1: 'Bangun asisten AI', title2: 'sambil ngobrol.',
      body: 'Arthur menerjemahkan kebutuhan Anda menjadi asisten AI siap pakai. Tanpa form panjang, tanpa istilah teknis.',
      role: 'Pembuat Asisten',
      cta: 'Lihat paket',
      chat: [
        { side: 'in', text: 'Bisnis Anda di bidang apa?' },
        { side: 'out', text: 'Toko sepatu online di WhatsApp.' },
        { side: 'in', text: 'Beri nama asisten AI ini.' },
        { side: 'out', text: 'Mira.' },
        { side: 'in', text: 'Mira aktif. Siap menerima pesanan.' },
      ] as Msg[],
    },
    solusi: {
      eyebrow: 'Solusi', title: 'Cocok untuk apa pun.',
      sub: 'Satu platform — untuk bisnis Anda maupun kebutuhan pribadi.',
      bullets: ['Membalas pertanyaan produk & harga', 'Bantu booking atau follow-up otomatis', 'Eskalasi ke Anda saat butuh manusia'],
      heading: (name: string, label: string) => `${name}, asisten AI Anda untuk ${label.toLowerCase()}.`,
      body: 'Memahami produk, harga, dan jadwal Anda. Berbicara dengan nada yang sesuai brand — tidak terdengar seperti robot.',
    },
    testimonial: {
      eyebrow: 'Cerita pelanggan', title: 'Sudah dirasakan, bukan dijanjikan.',
      items: [
        { q: 'Order naik tiga kali sejak pakai Clevio. AI-nya lebih sabar dari saya.', a: 'Rina', r: 'Owner Toko Online' },
        { q: 'Tiga admin kewalahan kini jadi satu AI. Tim bisa fokus closing.', a: 'Budi', r: 'Klinik Kecantikan' },
        { q: 'Sepuluh menit selesai. Saya kira bakal rumit, ternyata cukup ngobrol.', a: 'Andre', r: 'Agen Properti' },
      ],
    },
    pricing: {
      eyebrow: 'Harga', title: 'Harga sederhana.', sub: 'Mulai gratis. Tingkatkan kapan saja.',
      monthly: 'Bulanan', annual: 'Tahunan · hemat 20%',
      per: '/bln', startFree: 'Mulai gratis', pick: 'Pilih paket',
      plans: [
        { name: 'Starter', m: 0, a: 0, items: ['1 asisten AI', '500 pesan / bulan', 'Dukungan email'] },
        { name: 'Growth', m: 299, a: 239, items: ['5 asisten AI', '10.000 pesan / bulan', 'Integrasi dokumen', 'Dukungan prioritas'], featured: true },
        { name: 'Business', m: 999, a: 799, items: ['Asisten tak terbatas', 'Pesan tak terbatas', 'SLA & onboarding'] },
      ],
      popular: 'Populer',
    },
    faq: {
      eyebrow: 'Bantuan', title: 'Pertanyaan umum.',
      items: [
        { q: 'Apakah perlu paham teknologi?', a: 'Tidak. Ngobrol singkat dengan Arthur, lima menit kemudian asisten AI Anda siap bekerja.' },
        { q: 'Apakah bisa pakai nomor WhatsApp saya?', a: 'Bisa. Scan QR sekali, AI langsung membalas dari nomor tersebut.' },
        { q: 'Apakah cocok untuk kebutuhan pribadi?', a: 'Sangat. Leo bisa mengatur pengingat, merangkum email, dan mengurus hal kecil sehari-hari.' },
        { q: 'Apakah data saya aman?', a: 'Data tersimpan di server pribadi Anda dan tidak digunakan untuk melatih model publik.' },
        { q: 'Bisa berhenti kapan saja?', a: 'Bebas berhenti kapan saja. Tanpa kontrak, tanpa biaya tersembunyi.' },
      ],
    },
    cta: { title: 'Mulai hari ini.', sub: 'Gratis untuk dicoba. Tanpa kartu kredit.', btn: 'Mulai sekarang' },
    footer: {
      clevio: 'Clevio', dukungan: 'Dukungan', perusahaan: 'Perusahaan', legal: 'Legal',
      links: {
        solusi: 'Solusi', cara: 'Cara kerja', harga: 'Harga',
        faq: 'FAQ', kontak: 'Hubungi kami', status: 'Status sistem',
        tentang: 'Tentang', karier: 'Karier', hubungi: 'Kontak',
        privasi: 'Privasi', ketentuan: 'Ketentuan', keamanan: 'Keamanan',
      },
      copyright: 'Dibuat di Indonesia.', systems: 'Semua sistem normal',
    },
    useCases: [
      { key: 'shop', label: 'Toko Online', name: 'Mira',
        chat: [
          { side: 'in', text: 'Ready Nike Air size 42?' },
          { side: 'out', text: 'Ready 3 pcs Kak. Hitam atau putih?' },
          { side: 'in', text: 'Putih.' },
          { side: 'out', text: 'Rp 1.299.000, gratis ongkir. Checkout sekarang?' },
        ] },
      { key: 'clinic', label: 'Klinik', name: 'Sasha',
        chat: [
          { side: 'in', text: 'Booking dr. Sari hari Sabtu.' },
          { side: 'out', text: 'Tersedia 13.00, 14.30, 16.00. Pilih yang mana?' },
          { side: 'in', text: '14.30.' },
          { side: 'out', text: 'Tercatat ✓ Boleh nama lengkapnya?' },
        ] },
      { key: 'property', label: 'Properti', name: 'Reza',
        chat: [
          { side: 'in', text: 'Cari rumah 2 lantai di BSD, budget 2M.' },
          { side: 'out', text: '4 unit cocok. Rekomendasi: Foresta 1.95M.' },
          { side: 'in', text: 'Kirim brosurnya.' },
          { side: 'out', text: 'Terkirim 📄 Mau jadwal survei akhir pekan?' },
        ] },
      { key: 'personal', label: 'Pribadi', name: 'Leo',
        chat: [
          { side: 'in', text: 'Ingatkan bayar listrik tiap tanggal 25.' },
          { side: 'out', text: 'Siap. Pengingat bulanan tanggal 25 dibuat.' },
          { side: 'in', text: 'Rangkum email penting hari ini.' },
          { side: 'out', text: '3 email penting. Mau saya bacakan?' },
        ] },
    ],
  },
  en: {
    nav: { solusi: 'Solutions', cara: 'How it works', harga: 'Pricing', bantuan: 'Help', masuk: 'Sign in' },
    hero: {
      eyebrow: 'Introducing',
      title1: 'AI assistant for',
      title2: 'your WhatsApp.',
      sub: 'Replies to customers, schedules appointments, handles small tasks — all day long. Ready in five minutes.',
      cta: 'Start free',
      learn: 'Learn more',
      badge: 'Active now',
      heroChat: [
        { side: 'in', text: 'Hi, are you open?' },
        { side: 'out', text: 'Hi! Open 24 hours 😊 How can I help?' },
        { side: 'in', text: 'I want to order a birthday cake for tomorrow.' },
        { side: 'out', text: 'Sure! What size and flavor?' },
        { side: 'in', text: '20cm, chocolate.' },
        { side: 'out', text: 'Got it! Delivery or pick-up?' },
      ],
    },
    how: {
      eyebrow: 'How it works', title: 'Five minutes, then done.',
      steps: [
        { n: '01', t: 'Talk to Arthur', d: 'Describe your business in plain words. Arthur takes care of the rest.' },
        { n: '02', t: 'Connect WhatsApp', d: 'Scan a QR once. Your number is now staffed by AI.' },
        { n: '03', t: 'AI gets to work', d: 'Customers get replied automatically — in your tone.' },
      ],
    },
    arthur: {
      eyebrow: 'Arthur', title1: 'Build an AI assistant', title2: 'by chatting.',
      body: 'Arthur turns your needs into a ready-to-use AI assistant. No long forms, no technical jargon.',
      role: 'Assistant Builder',
      cta: 'See pricing',
      chat: [
        { side: 'in', text: 'What kind of business do you run?' },
        { side: 'out', text: 'Online shoe store on WhatsApp.' },
        { side: 'in', text: 'Give this assistant a name.' },
        { side: 'out', text: 'Mira.' },
        { side: 'in', text: 'Mira is active. Ready for orders.' },
      ] as Msg[],
    },
    solusi: {
      eyebrow: 'Solutions', title: 'Built for anything.',
      sub: 'One platform — for your business or personal needs.',
      bullets: ['Answers product & pricing questions', 'Handles bookings and follow-ups', 'Escalates to you when needed'],
      heading: (name: string, label: string) => `${name}, your AI assistant for ${label.toLowerCase()}.`,
      body: 'Knows your products, prices, and schedule. Speaks in a brand-matched tone — never sounds like a robot.',
    },
    testimonial: {
      eyebrow: 'Customer stories', title: 'Proven, not promised.',
      items: [
        { q: 'Orders tripled since switching to Clevio. The AI is more patient than I am.', a: 'Rina', r: 'Online Store Owner' },
        { q: 'Three overwhelmed admins became one AI. The team now focuses on closing.', a: 'Budi', r: 'Beauty Clinic' },
        { q: 'Ten minutes and done. I expected complexity, got a chat.', a: 'Andre', r: 'Property Agent' },
      ],
    },
    pricing: {
      eyebrow: 'Pricing', title: 'Simple pricing.', sub: 'Start free. Upgrade anytime.',
      monthly: 'Monthly', annual: 'Annual · save 20%',
      per: '/mo', startFree: 'Start free', pick: 'Choose plan',
      plans: [
        { name: 'Starter', m: 0, a: 0, items: ['1 AI assistant', '500 messages / month', 'Email support'] },
        { name: 'Growth', m: 299, a: 239, items: ['5 AI assistants', '10,000 messages / month', 'Document integration', 'Priority support'], featured: true },
        { name: 'Business', m: 999, a: 799, items: ['Unlimited assistants', 'Unlimited messages', 'SLA & onboarding'] },
      ],
      popular: 'Popular',
    },
    faq: {
      eyebrow: 'Help', title: 'Common questions.',
      items: [
        { q: 'Do I need to be tech-savvy?', a: 'No. A short chat with Arthur, then your AI assistant is ready in five minutes.' },
        { q: 'Can I use my own WhatsApp number?', a: 'Yes. Scan a QR once and AI replies from your number.' },
        { q: 'Does it work for personal use?', a: 'Absolutely. Leo can set reminders, summarize emails, and handle small daily tasks.' },
        { q: 'Is my data safe?', a: 'Stored on your private server and never used to train public models.' },
        { q: 'Can I cancel anytime?', a: 'Cancel anytime. No contracts, no hidden fees.' },
      ],
    },
    cta: { title: 'Start today.', sub: 'Free to try. No credit card.', btn: 'Get started' },
    footer: {
      clevio: 'Clevio', dukungan: 'Support', perusahaan: 'Company', legal: 'Legal',
      links: {
        solusi: 'Solutions', cara: 'How it works', harga: 'Pricing',
        faq: 'FAQ', kontak: 'Contact us', status: 'System status',
        tentang: 'About', karier: 'Careers', hubungi: 'Contact',
        privasi: 'Privacy', ketentuan: 'Terms', keamanan: 'Security',
      },
      copyright: 'Made in Indonesia.', systems: 'All systems normal',
    },
    useCases: [
      { key: 'shop', label: 'Online Store', name: 'Mira',
        chat: [
          { side: 'in', text: 'Nike Air size 42 in stock?' },
          { side: 'out', text: '3 pcs ready. Black or white?' },
          { side: 'in', text: 'White.' },
          { side: 'out', text: 'Rp 1,299,000, free shipping. Checkout now?' },
        ] },
      { key: 'clinic', label: 'Clinic', name: 'Sasha',
        chat: [
          { side: 'in', text: 'Book dr. Sari, Saturday.' },
          { side: 'out', text: 'Available at 1pm, 2:30pm, 4pm. Which?' },
          { side: 'in', text: '2:30pm.' },
          { side: 'out', text: 'Saved ✓ Your full name?' },
        ] },
      { key: 'property', label: 'Property', name: 'Reza',
        chat: [
          { side: 'in', text: 'Two-floor home in BSD, 2B budget.' },
          { side: 'out', text: '4 units match. Top pick: Foresta 1.95B.' },
          { side: 'in', text: 'Send brochure.' },
          { side: 'out', text: 'Sent 📄 Schedule a visit this weekend?' },
        ] },
      { key: 'personal', label: 'Personal', name: 'Leo',
        chat: [
          { side: 'in', text: 'Remind me to pay electricity on the 25th.' },
          { side: 'out', text: 'Done. Monthly reminder set for the 25th.' },
          { side: 'in', text: 'Summarize my important emails today.' },
          { side: 'out', text: '3 important emails. Want me to read them?' },
        ] },
    ],
  },
}

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms`, opacity: visible ? undefined : 0 }}
      className={`${visible ? 'fade-up' : ''} ${className}`.trim()}
    >
      {children}
    </div>
  )
}

function Arrow() { return <span className="inline-block translate-y-[-1px] ml-0.5">›</span> }

function WaBubble({ side, text, delay = 0 }: { side: 'in' | 'out'; text: string; delay?: number }) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const cls = side === 'in'
    ? 'self-start bg-white text-[#111] rounded-tl-[2px]'
    : 'self-end bg-[#d9fdd3] text-[#111] rounded-tr-[2px]'
  return (
    <div
      style={{ animationDelay: `${delay}ms`, opacity: 0, animation: `pop 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms forwards` }}
      className={`relative max-w-[82%] px-[10px] py-[6px] rounded-[10px] text-[13px] leading-snug shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${cls}`}
    >
      <span>{text}</span>
      <span className="block text-[10px] text-black/40 text-right mt-[3px] leading-none float-right ml-2">
        {time}{side === 'out' && <span className="text-[#53bdeb] ml-0.5">✓✓</span>}
      </span>
    </div>
  )
}

function IPhoneMockup({ messages }: { messages: Msg[] }) {
  return (
    <div className="relative w-[280px] mx-auto" style={{ aspectRatio: '312/642' }}>
      {/* phone body */}
      <div
        className="relative w-full h-full rounded-[48px] p-[10px]"
        style={{
          background: 'linear-gradient(145deg, #2a2a2e, #0c0c0e)',
          boxShadow: '0 30px 80px -32px rgba(10,37,64,0.30), 0 0 0 2px rgba(255,255,255,0.04) inset',
          animation: 'phonefloat 7s ease-in-out infinite',
        }}
      >
        {/* side button */}
        <div className="absolute left-[-2px] top-[130px] w-[3px] h-[58px] rounded bg-[#1a1a1c]"
          style={{ boxShadow: '0 -80px 0 #1a1a1c, 0 80px 0 #1a1a1c' }} />
        {/* screen */}
        <div className="relative w-full h-full rounded-[38px] overflow-hidden" style={{ background: '#efeae2' }}>
          {/* dynamic island */}
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[80px] h-[24px] bg-black rounded-[14px] z-10" />
          {/* status bar */}
          <div className="absolute top-[12px] left-0 right-0 flex items-center justify-between px-5 pt-1 text-[11px] font-semibold text-white z-10" style={{ paddingTop: '2px' }}>
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor"><path d="M2 16h3v4H2zm5-3h3v7H7zm5-4h3v11h-3zm5-4h3v15h-3z"/></svg>
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor"><path d="M12 6c3 0 5.7 1.2 7.6 3.1l-1.4 1.4A8.6 8.6 0 0 0 12 8a8.6 8.6 0 0 0-6.2 2.5L4.4 9.1A10.6 10.6 0 0 1 12 6zm0 4c1.9 0 3.6.8 4.8 2l-1.4 1.4A4.6 4.6 0 0 0 12 12c-1.3 0-2.5.5-3.4 1.4L7.2 12A6.6 6.6 0 0 1 12 10zm0 4c.8 0 1.5.3 2 .8L12 17l-2-2.2c.5-.5 1.2-.8 2-.8z"/></svg>
              <svg viewBox="0 0 28 24" className="w-4 h-3" fill="currentColor"><rect x="1" y="7" width="22" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/><rect x="3" y="9" width="16" height="6" rx="1.5"/><rect x="24" y="10" width="2" height="4" rx="1"/></svg>
            </span>
          </div>
          {/* WA header */}
          <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3 pt-[46px] pb-[10px]" style={{ background: '#075e54', zIndex: 5 }}>
            <span className="text-white text-[18px] leading-none">‹</span>
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-[13px] font-medium">M</span>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[13px] font-medium leading-tight truncate">Mira</div>
              <div className="text-white/70 text-[11px] leading-tight">online</div>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/80" fill="currentColor"><path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/></svg>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/80" fill="currentColor"><path d="M12 2a2 2 0 0 0-2 2 2 2 0 0 0 4 0 2 2 0 0 0-2-2zm0 6a2 2 0 0 0-2 2 2 2 0 0 0 4 0 2 2 0 0 0-2-2zm0 6a2 2 0 0 0-2 2 2 2 0 0 0 4 0 2 2 0 0 0-2-2z"/></svg>
          </div>
          {/* chat area */}
          <div className="absolute left-0 right-0 bottom-[52px] top-[96px] overflow-hidden flex flex-col justify-end gap-[6px] px-[10px] py-[10px]">
            {messages.map((m, i) => (
              <WaBubble key={i} side={m.side} text={m.text} delay={i * 260} />
            ))}
          </div>
          {/* input bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-[10px]" style={{ background: '#f0f0f0' }}>
            <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-[#999]">Ketik pesan</div>
            <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center" style={{ background: '#075e54' }}>
              <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] text-white" fill="currentColor"><path d="M3 20.5 21 12 3 3.5 3 10l13 2-13 2z"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConversationCard({ name, messages }: { name: string; messages: Msg[] }) {
  return (
    <div className="relative rounded-[24px] bg-white border border-ink-100 overflow-hidden shadow-[0_24px_64px_-24px_rgba(10,37,64,0.18)]">
      <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[13px] font-medium">{name[0]}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate">{name}</div>
          <div className="text-[11px] text-white/70">online</div>
        </div>
      </div>
      <div className="flex flex-col gap-[6px] px-4 py-4 min-h-[260px]"
        style={{ backgroundColor: '#efeae2', backgroundImage: 'radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
        {messages.map((m, i) => (
          <WaBubble key={i} side={m.side} text={m.text} delay={i * 200} />
        ))}
      </div>
    </div>
  )
}

function StepIcon({ kind }: { kind: 'chat' | 'qr' | 'spark' }) {
  if (kind === 'chat') {
    return (
      <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 18a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H30l-8 8v-8h-4a4 4 0 0 1-4-4Z" />
        <path d="M24 24h16M24 30h12" />
      </svg>
    )
  }
  if (kind === 'qr') {
    return (
      <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <rect x="12" y="12" width="16" height="16" rx="2" />
        <rect x="36" y="12" width="16" height="16" rx="2" />
        <rect x="12" y="36" width="16" height="16" rx="2" />
        <rect x="18" y="18" width="4" height="4" fill="currentColor" stroke="none" />
        <rect x="42" y="18" width="4" height="4" fill="currentColor" stroke="none" />
        <rect x="18" y="42" width="4" height="4" fill="currentColor" stroke="none" />
        <path d="M36 36h4v4M44 36v4M36 44h4M48 36v8M44 48h8M36 50v2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 10v8M32 46v8M10 32h8M46 32h8M16 16l5 5M43 43l5 5M16 48l5-5M43 21l5-5" />
      <circle cx="32" cy="32" r="8" fill="currentColor" stroke="none" opacity="0.1" />
      <circle cx="32" cy="32" r="8" />
      <path d="M28 32l3 3 5-6" />
    </svg>
  )
}

function LangSwitch({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="inline-flex items-center border border-ink-200 rounded-full p-0.5 text-[11px]">
      {(['id', 'en'] as Lang[]).map((l) => (
        <button key={l} onClick={() => setLang(l)}
          className={`px-2.5 py-0.5 rounded-full transition uppercase tracking-wider ${
            lang === l ? 'bg-ink-900 text-white' : 'text-ink-500 hover:text-ink-900'
          }`}>
          {l}
        </button>
      ))}
    </div>
  )
}

export default function Landing() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('clevio_lang') as Lang) || 'id')
  useEffect(() => { localStorage.setItem('clevio_lang', lang) }, [lang])

  useEffect(() => {
    document.body.dataset.landing = 'true'
    return () => { delete document.body.dataset.landing }
  }, [])

  const t = COPY[lang]
  const [tab, setTab] = useState<string>(t.useCases[0].key)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const active = t.useCases.find((u) => u.key === tab) || t.useCases[0]

  return (
    <div className="min-h-screen bg-white text-ink-900">

      {/* NAV — glassmorphism sticky */}
      <nav className="sticky top-0 z-40 border-b border-ink-100"
        style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)' }}>
        <div className="max-w-[1080px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="text-[17px] font-semibold tracking-[-0.02em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0071e3]" />
            Clevio
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[14px] text-ink-700">
            <a href="#solusi" className="hover:text-ink-900 transition-colors">{t.nav.solusi}</a>
            <a href="#cara" className="hover:text-ink-900 transition-colors">{t.nav.cara}</a>
            <a href="#harga" className="hover:text-ink-900 transition-colors">{t.nav.harga}</a>
            <a href="#faq" className="hover:text-ink-900 transition-colors">{t.nav.bantuan}</a>
          </div>
          <div className="flex items-center gap-4">
            <LangSwitch lang={lang} setLang={setLang} />
            <Link to="/login" className="text-[14px] text-ink-700 hover:text-ink-900 transition-colors">{t.nav.masuk}</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="snap-section relative overflow-hidden bg-white" id="top">
        {/* single soft orb — tasteful, not AI-gimmick */}
        <div className="absolute top-[-10%] right-[-8%] w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle at 60% 40%, rgba(0,113,227,0.10), rgba(0,113,227,0) 65%)', filter: 'blur(1px)' }} />

        <div className="relative max-w-[1080px] mx-auto px-6 pt-20 md:pt-28 pb-20 md:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* LEFT copy */}
            <div className="text-center lg:text-left">
              <FadeUp>
                <span className="inline-flex items-center gap-2 px-3 py-[5px] rounded-full border border-ink-200 bg-white/60 text-[13px] text-ink-700"
                  style={{ backdropFilter: 'blur(12px)' }}>
                  <span className="relative w-[6px] h-[6px] flex-none">
                    <span className="absolute inset-0 rounded-full bg-[#0071e3] opacity-35" style={{ animation: 'ping 2.4s cubic-bezier(0.22,1,0.36,1) infinite', inset: '-3px' }} />
                    <span className="relative w-full h-full rounded-full block bg-[#0071e3]" />
                  </span>
                  {t.hero.eyebrow}
                </span>
              </FadeUp>
              <FadeUp delay={80}>
                <h1 className="mt-6 font-semibold tracking-[-0.035em] leading-[1.0]"
                  style={{ fontSize: 'clamp(44px, 6.6vw, 72px)' }}>
                  {t.hero.title1}<br />{t.hero.title2}
                </h1>
              </FadeUp>
              <FadeUp delay={160}>
                <p className="mt-6 text-[19px] md:text-[21px] text-ink-500 max-w-[420px] mx-auto lg:mx-0" style={{ lineHeight: 1.45 }}>
                  {t.hero.sub}
                </p>
              </FadeUp>
              <FadeUp delay={240}>
                <div className="mt-9 flex items-center justify-center lg:justify-start gap-6 flex-wrap">
                  <Link to="/login"
                    className="inline-flex items-center justify-center rounded-full text-white text-[15px] font-medium px-6 py-3 transition-all hover:-translate-y-px"
                    style={{ background: '#0071e3' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0058b9')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#0071e3')}>
                    {t.hero.cta}
                  </Link>
                  <a href="#cara" className="inline-flex items-center gap-1 text-[15px] text-ink-900 hover:text-ink-700 transition-colors">
                    {t.hero.learn}<Arrow />
                  </a>
                </div>
              </FadeUp>
            </div>

            {/* RIGHT — iPhone mockup */}
            <FadeUp delay={200} className="relative flex justify-center lg:justify-end">
              {/* floating glass chip 1 — top left */}
              <div className="absolute top-[60px] left-[-20px] lg:left-[-40px] flex items-center gap-2 px-3 py-2.5 rounded-2xl text-[13px] font-medium z-20 hidden md:flex"
                style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -16px rgba(10,37,64,0.14)', animation: 'phonefloat 7s ease-in-out infinite', whiteSpace: 'nowrap' }}>
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] flex-none" fill="none" stroke="#0071e3" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z"/><path d="M12 6v6l4 2"/>
                </svg>
                <span className="text-ink-800">Balas otomatis 24 jam</span>
              </div>
              {/* floating glass chip 2 — bottom right */}
              <div className="absolute bottom-[90px] right-[-10px] lg:right-[-36px] flex items-center gap-2 px-3 py-2.5 rounded-2xl text-[13px] font-medium z-20 hidden md:flex"
                style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -16px rgba(10,37,64,0.14)', animation: 'phonefloat 7.5s ease-in-out 0.5s infinite', whiteSpace: 'nowrap' }}>
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] flex-none" fill="none" stroke="#0071e3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                <span className="text-ink-800">Siap dalam 5 menit</span>
              </div>

              <IPhoneMockup messages={t.hero.heroChat} />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="cara" className="snap-section bg-ink-50 border-y border-ink-100">
        <div className="max-w-[1000px] mx-auto px-6 py-24 md:py-32">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-[13px] tracking-[0.18em] uppercase text-[#0071e3] font-medium">{t.how.eyebrow}</p>
              <h2 className="mt-3 font-semibold tracking-[-0.02em] leading-[1.05]" style={{ fontSize: 'clamp(34px, 5vw, 52px)' }}>{t.how.title}</h2>
            </div>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-6">
            {t.how.steps.map((s, i) => {
              const kind: 'chat' | 'qr' | 'spark' = i === 0 ? 'chat' : i === 1 ? 'qr' : 'spark'
              return (
                <FadeUp key={s.n} delay={i * 80}>
                  <div className="relative rounded-[24px] bg-white border border-ink-100 p-8 h-full overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl opacity-50 pointer-events-none"
                      style={{ background: 'radial-gradient(circle, rgba(0,113,227,0.18), rgba(0,113,227,0) 70%)' }} />
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full text-[12px] font-medium text-[#0071e3]"
                          style={{ background: 'rgba(0,113,227,0.08)', border: '1px solid rgba(0,113,227,0.15)' }}>{s.n}</div>
                        <div className="w-14 h-14 text-[#0071e3]">
                          <StepIcon kind={kind} />
                        </div>
                      </div>
                      <h3 className="mt-7 text-[22px] font-semibold tracking-tight">{s.t}</h3>
                      <p className="mt-2 text-[15px] text-ink-500 leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                </FadeUp>
              )
            })}
          </div>
        </div>
      </section>

      {/* ARTHUR */}
      <section className="snap-section bg-white">
        <div className="max-w-[1000px] mx-auto px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <FadeUp>
              <p className="text-[13px] tracking-[0.18em] uppercase text-[#0071e3] font-medium">{t.arthur.eyebrow}</p>
              <h2 className="mt-3 font-semibold tracking-[-0.02em] leading-[1.05]" style={{ fontSize: 'clamp(34px, 4.5vw, 48px)' }}>
                {t.arthur.title1}<br />{t.arthur.title2}
              </h2>
              <p className="mt-5 text-[17px] text-ink-500 max-w-md leading-relaxed">{t.arthur.body}</p>
              <a href="#harga" className="inline-flex items-center gap-1 text-[15px] text-[#0071e3] hover:text-[#0058b9] mt-6 transition-colors">
                {t.arthur.cta}<Arrow />
              </a>
            </FadeUp>
            <FadeUp delay={100}>
              <div className="rounded-[24px] bg-white p-6 md:p-8 border border-ink-100 shadow-[0_24px_64px_-24px_rgba(10,37,64,0.12)]">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ink-100">
                  <span className="w-7 h-7 rounded-full bg-[#0071e3] text-white flex items-center justify-center text-[12px] font-medium">A</span>
                  <div>
                    <div className="text-[13px] font-medium">Arthur</div>
                    <div className="text-[11px] text-ink-400">{t.arthur.role}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {t.arthur.chat.map((m, i) => (
                    <div key={i} className={`text-[14px] px-3.5 py-2 rounded-[18px] max-w-[80%] ${
                      m.side === 'in'
                        ? 'self-start bg-ink-50 border border-ink-100 text-ink-900'
                        : 'self-end text-white'
                    }`} style={m.side === 'out' ? { background: '#0071e3' } : {}}>
                      {m.text}
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* SOLUSI */}
      <section id="solusi" className="snap-section bg-ink-50 border-y border-ink-100">
        <div className="max-w-[1000px] mx-auto px-6 py-24 md:py-32">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-[13px] tracking-[0.18em] uppercase text-[#0071e3] font-medium">{t.solusi.eyebrow}</p>
              <h2 className="mt-3 font-semibold tracking-[-0.02em] leading-[1.05]" style={{ fontSize: 'clamp(34px, 5vw, 52px)' }}>{t.solusi.title}</h2>
              <p className="mt-4 text-[19px] text-ink-500 max-w-md mx-auto">{t.solusi.sub}</p>
            </div>
          </FadeUp>
          <div className="flex justify-center mb-14">
            <div className="inline-flex bg-white border border-ink-200 rounded-full p-1 gap-0.5">
              {t.useCases.map((u) => (
                <button key={u.key} onClick={() => setTab(u.key)}
                  className="px-5 py-2 rounded-full text-[14px] transition-all"
                  style={tab === u.key
                    ? { background: '#0071e3', color: '#fff' }
                    : { color: '#424245' }}
                  onMouseEnter={e => { if (tab !== u.key) e.currentTarget.style.color = '#1d1d1f' }}
                  onMouseLeave={e => { if (tab !== u.key) e.currentTarget.style.color = '#424245' }}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>
          <div key={active.key + lang} className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            <FadeUp>
              <div className="text-[12px] tracking-[0.18em] uppercase text-ink-400 font-medium">{active.label}</div>
              <h3 className="mt-3 font-semibold tracking-[-0.02em] leading-[1.08]" style={{ fontSize: 'clamp(28px, 3.5vw, 40px)' }}>
                {t.solusi.heading(active.name, active.label)}
              </h3>
              <p className="mt-5 text-[16px] text-ink-500 leading-relaxed max-w-md">{t.solusi.body}</p>
              <ul className="mt-7 space-y-3 text-[15px] text-ink-700">
                {t.solusi.bullets.map((it) => (
                  <li key={it} className="flex items-start gap-3">
                    <span className="flex-none w-[22px] h-[22px] rounded-full flex items-center justify-center mt-[1px]"
                      style={{ background: 'rgba(0,113,227,0.08)' }}>
                      <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="#0071e3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 6l3 3 5-5"/>
                      </svg>
                    </span>
                    {it}
                  </li>
                ))}
              </ul>
            </FadeUp>
            <FadeUp delay={100}>
              <ConversationCard name={active.name} messages={active.chat} />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="snap-section bg-white">
        <div className="max-w-[1000px] mx-auto px-6 py-24 md:py-32">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-[13px] tracking-[0.18em] uppercase text-[#0071e3] font-medium">{t.testimonial.eyebrow}</p>
              <h2 className="mt-3 font-semibold tracking-[-0.02em] leading-[1.05]" style={{ fontSize: 'clamp(34px, 5vw, 52px)' }}>{t.testimonial.title}</h2>
            </div>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-6">
            {t.testimonial.items.map((it, i) => (
              <FadeUp key={i} delay={i * 60}>
                <figure className="h-full p-8 rounded-[20px] bg-ink-50 border border-ink-100">
                  <blockquote className="text-[18px] text-ink-900 leading-snug tracking-tight">&ldquo;{it.q}&rdquo;</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-ink-200" />
                    <div>
                      <div className="text-[14px] font-medium">{it.a}</div>
                      <div className="text-[12px] text-ink-500">{it.r}</div>
                    </div>
                  </figcaption>
                </figure>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="harga" className="snap-section bg-ink-50 border-y border-ink-100">
        <div className="max-w-[1000px] mx-auto px-6 py-24 md:py-32">
          <FadeUp>
            <div className="text-center mb-8">
              <p className="text-[13px] tracking-[0.18em] uppercase text-[#0071e3] font-medium">{t.pricing.eyebrow}</p>
              <h2 className="mt-3 font-semibold tracking-[-0.02em] leading-[1.05]" style={{ fontSize: 'clamp(34px, 5vw, 52px)' }}>{t.pricing.title}</h2>
              <p className="mt-4 text-[19px] text-ink-500">{t.pricing.sub}</p>
            </div>
          </FadeUp>
          <div className="flex justify-center mt-4 mb-12">
            <div className="inline-flex border border-ink-200 rounded-full p-1 bg-white gap-0.5">
              {(['monthly', 'annual'] as const).map((b) => (
                <button key={b} onClick={() => setBilling(b)}
                  className="px-5 py-2 rounded-full text-[13px] transition-all"
                  style={billing === b ? { background: '#0071e3', color: '#fff' } : { color: '#424245' }}>
                  {b === 'monthly' ? t.pricing.monthly : t.pricing.annual}
                </button>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {t.pricing.plans.map((p) => {
              const price = billing === 'monthly' ? p.m : p.a
              return (
                <FadeUp key={p.name} delay={t.pricing.plans.indexOf(p) * 60}>
                  <div className={`relative rounded-[20px] p-9 h-full flex flex-col bg-white border transition-all hover:-translate-y-1 ${
                    p.featured ? 'border-[#0071e3] shadow-[0_0_0_1px_#0071e3]' : 'border-ink-100'
                  }`} style={{ boxShadow: p.featured ? '0 0 0 1px #0071e3, 0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -16px rgba(10,37,64,0.14)' : undefined }}>
                    {p.featured && (
                      <span className="absolute -top-[12px] left-1/2 -translate-x-1/2 text-[11px] tracking-[0.04em] font-medium bg-[#0071e3] text-white px-[14px] py-[5px] rounded-full">
                        {t.pricing.popular}
                      </span>
                    )}
                    <div className="text-[14px] text-ink-500">{p.name}</div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-[46px] font-semibold tracking-[-0.03em]">
                        {price === 0 ? (lang === 'id' ? 'Rp 0' : '$0') : (lang === 'id' ? `Rp ${price}k` : `$${price}`)}
                      </span>
                      <span className="text-[14px] text-ink-400">{t.pricing.per}</span>
                    </div>
                    <ul className="mt-7 space-y-3.5 text-[15px] text-ink-700 flex-1">
                      {p.items.map((it) => (
                        <li key={it} className="flex items-start gap-3">
                          <span className="flex-none w-5 h-5 rounded-full flex items-center justify-center mt-[1px]"
                            style={{ background: 'rgba(0,113,227,0.08)' }}>
                            <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="#0071e3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 6l3 3 5-5"/>
                            </svg>
                          </span>
                          {it}
                        </li>
                      ))}
                    </ul>
                    <Link to="/login"
                      className="mt-8 w-full inline-flex items-center justify-center rounded-full text-[15px] font-medium py-3 transition-all"
                      style={p.featured
                        ? { background: '#0071e3', color: '#fff' }
                        : { border: '1px solid #d2d2d7', background: '#fff', color: '#1d1d1f' }}>
                      {price === 0 ? t.pricing.startFree : t.pricing.pick}
                    </Link>
                  </div>
                </FadeUp>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="snap-section bg-white">
        <div className="max-w-[760px] mx-auto px-6 py-24 md:py-32">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-[13px] tracking-[0.18em] uppercase text-[#0071e3] font-medium">{t.faq.eyebrow}</p>
              <h2 className="mt-3 font-semibold tracking-[-0.02em] leading-[1.05]" style={{ fontSize: 'clamp(34px, 5vw, 52px)' }}>{t.faq.title}</h2>
            </div>
          </FadeUp>
          <div className="border-t border-ink-100">
            {t.faq.items.map((f, i) => (
              <button key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left border-b border-ink-100 py-[26px] px-1 flex items-start gap-6">
                <span className="flex-1">
                  <span className="block text-[19px] font-medium tracking-[-0.01em] leading-snug">{f.q}</span>
                  {openFaq === i && (
                    <span className="block mt-3 text-[15px] text-ink-500 leading-relaxed">{f.a}</span>
                  )}
                </span>
                <span className="text-[#0071e3] mt-0.5 text-2xl leading-none font-light flex-none">{openFaq === i ? '−' : '+'}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="snap-section bg-[#0a2540] text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          }} />
        <div className="relative max-w-[860px] mx-auto px-6 py-24 md:py-32 text-center">
          <FadeUp>
            <h2 className="font-semibold tracking-[-0.025em] leading-[1.05]" style={{ fontSize: 'clamp(40px, 6vw, 64px)' }}>{t.cta.title}</h2>
            <p className="mt-5 text-[18px] text-white/70">{t.cta.sub}</p>
            <div className="mt-10">
              <Link to="/login"
                className="inline-flex items-center justify-center rounded-full bg-white text-[#0a2540] px-7 py-3 text-[15px] font-medium transition-all hover:bg-ink-100 hover:-translate-y-px">
                {t.cta.btn}
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink-50 border-t border-ink-100">
        <div className="max-w-[1000px] mx-auto px-6 py-12 text-[12px] text-ink-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10">
            <div>
              <div className="text-ink-900 font-medium mb-3">{t.footer.clevio}</div>
              <ul className="space-y-2">
                <li><a href="#solusi" className="hover:text-ink-900 transition-colors">{t.footer.links.solusi}</a></li>
                <li><a href="#cara" className="hover:text-ink-900 transition-colors">{t.footer.links.cara}</a></li>
                <li><a href="#harga" className="hover:text-ink-900 transition-colors">{t.footer.links.harga}</a></li>
              </ul>
            </div>
            <div>
              <div className="text-ink-900 font-medium mb-3">{t.footer.dukungan}</div>
              <ul className="space-y-2">
                <li><a href="#faq" className="hover:text-ink-900 transition-colors">{t.footer.links.faq}</a></li>
                <li><a href="#" className="hover:text-ink-900 transition-colors">{t.footer.links.kontak}</a></li>
                <li><a href="#" className="hover:text-ink-900 transition-colors">{t.footer.links.status}</a></li>
              </ul>
            </div>
            <div>
              <div className="text-ink-900 font-medium mb-3">{t.footer.perusahaan}</div>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-ink-900 transition-colors">{t.footer.links.tentang}</a></li>
                <li><a href="#" className="hover:text-ink-900 transition-colors">{t.footer.links.karier}</a></li>
                <li><a href="#" className="hover:text-ink-900 transition-colors">{t.footer.links.hubungi}</a></li>
              </ul>
            </div>
            <div>
              <div className="text-ink-900 font-medium mb-3">{t.footer.legal}</div>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="hover:text-ink-900 transition-colors">{t.footer.links.privasi}</Link></li>
                <li><Link to="/terms" className="hover:text-ink-900 transition-colors">{t.footer.links.ketentuan}</Link></li>
                <li><a href="#" className="hover:text-ink-900 transition-colors">{t.footer.links.keamanan}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-ink-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
            <div>© {new Date().getFullYear()} Clevio. {t.footer.copyright}</div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3]" />
              {t.footer.systems}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
