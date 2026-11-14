import { ChevronDown, Mail, MapPin, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { formatMad } from '../lib/i18n';

export function AboutPage() {
  useEffect(() => {
    document.title = 'À propos de CasaVente | E-Commerce Casablanca, Maroc';
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl font-bold text-[#142B4A]">À propos de CasaVente</h1>
      <p className="text-base text-slate-700 leading-relaxed">
        Fondée à Casablanca, <strong>CasaVente</strong> est une plateforme e-commerce marocaine généraliste conçue pour
        offrir aux particuliers et aux professionnels un accès simple, fiable et transparent aux meilleurs produits
        High-Tech, Informatique, Maison, Mode, Beauté et Sport.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        {[
          { num: '24h', label: 'Livraison express à Casablanca et Mohammedia' },
          { num: '12+', label: 'Grandes villes marocaines desservies en 48h–72h' },
          { num: '100%', label: 'Produits authentiques avec garantie locale' },
        ].map((item) => (
          <div key={item.num} className="border border-slate-200 rounded-xl p-6 bg-slate-50">
            <p className="text-3xl font-extrabold font-mono-num text-[#F28C28]">{item.num}</p>
            <p className="mt-2 text-sm text-slate-700">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactPage() {
  const { notify } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    document.title = 'Contactez CasaVente Casablanca | Support Client Maroc';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      notify(res.message);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur d’envoi', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-10">
      <div className="md:col-span-5 space-y-5">
        <h1 className="text-3xl font-bold text-[#142B4A]">Contactez-nous</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Notre service client basé à Maarif, Casablanca est à votre écoute du lundi au samedi de 9h00 à 19h00.
        </p>
        <div className="space-y-3 text-sm text-slate-700 pt-2">
          <p className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#F28C28]" />
            <span>148 Boulevard d’Anfa, Maarif, Casablanca 20100</span>
          </p>
          <p className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-[#F28C28]" />
            <span className="font-mono-num">+212 522 48 90 12</span>
          </p>
          <p className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#F28C28]" />
            <span>support@casavente.ma</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom complet *"
            className="h-11 px-3 border border-slate-200 rounded-lg text-sm"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Téléphone (+212...)"
            className="h-11 px-3 border border-slate-200 rounded-lg text-sm font-mono-num"
          />
        </div>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Adresse e-mail *"
          className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
        />
        <input
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Objet de votre demande *"
          className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
        />
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Votre message *"
          className="w-full p-3 border border-slate-200 rounded-lg text-sm"
        />
        <button
          type="submit"
          disabled={sending}
          className="px-6 py-3 rounded-lg bg-[#142B4A] text-white text-sm font-bold hover:bg-[#0F213A] cursor-pointer"
        >
          {sending ? 'Envoi...' : 'Envoyer le message'}
        </button>
      </form>
    </div>
  );
}

export function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  useEffect(() => {
    document.title = 'Foire aux questions (FAQ) | CasaVente Maroc';
  }, []);

  const faqs = [
    {
      q: 'Quels sont les délais de livraison au Maroc ?',
      a: 'À Casablanca et Mohammedia, les commandes passées avant 15h sont livrées sous 24 heures ouvrées. Pour Rabat, Marrakech, Tanger, Fès et Agadir, comptez 48h à 72h ouvrées.',
    },
    {
      q: 'Puis-je payer en espèces à la livraison ?',
      a: 'Oui, le paiement à la livraison (Cash on Delivery) est disponible partout au Maroc. Vous réglez en Dirhams marocains directement au livreur lors de la réception.',
    },
    {
      q: 'Comment utiliser un code promotionnel ?',
      a: 'Lors de la consultation de votre panier ou à l’étape récapitulatif de commande, saisissez votre code (ex: CASA10) puis cliquez sur Appliquer.',
    },
    {
      q: 'Quelle est votre politique de retour ?',
      a: 'Vous disposez de 14 jours calendaires après réception pour retourner un produit neuf dans son emballage d’origine complet.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-bold text-[#142B4A]">Questions Fréquentes (FAQ)</h1>
      <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
        {faqs.map((item, idx) => (
          <div key={item.q} className="p-5">
            <button
              type="button"
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full flex items-center justify-between text-start font-bold text-[#142B4A] cursor-pointer"
            >
              <span>{item.q}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`} />
            </button>
            {openIdx === idx && <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ShippingConditionsPage() {
  const { shippingZones, lang } = useStore();
  useEffect(() => {
    document.title = 'Conditions & Tarifs de livraison au Maroc | CasaVente';
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-bold text-[#142B4A]">Conditions et tarifs de livraison au Maroc</h1>
      <p className="text-sm text-slate-600">
        CasaVente expédie vos commandes depuis son entrepôt logistique de Casablanca vers toutes les villes du Royaume.
      </p>
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
        <table className="w-full text-sm text-start">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start">Ville</th>
              <th className="px-4 py-3 text-start">Région</th>
              <th className="px-4 py-3 text-start">Délai estimé</th>
              <th className="px-4 py-3 text-end">Tarif Standard</th>
              <th className="px-4 py-3 text-end">Gratuit dès</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shippingZones.map((z) => (
              <tr key={z.id}>
                <td className="px-4 py-3 font-semibold text-slate-900">{z.city}</td>
                <td className="px-4 py-3 text-slate-600">{z.zone_name}</td>
                <td className="px-4 py-3 text-slate-600">{z.estimated_days}</td>
                <td className="px-4 py-3 text-end font-mono-num">{formatMad(z.fee_mad, lang)}</td>
                <td className="px-4 py-3 text-end font-mono-num text-emerald-700 font-semibold">
                  {formatMad(z.free_threshold_mad, lang)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LegalPage({ type }: { type: 'cgv' | 'privacy' | 'returns' }) {
  const content = {
    cgv: {
      title: 'Conditions Générales de Vente (CGV)',
      paragraphs: [
        'Les présentes conditions régissent les ventes effectuées sur casavente.ma par CasaVente SARL, immatriculée au Registre du Commerce de Casablanca.',
        'Tous les prix sont affichés en Dirhams Marocains (MAD / DH), toutes taxes comprises (TTC). Les frais de livraison sont indiqués avant la validation finale de la commande.',
        'La commande est confirmée après validation par notre équipe de Casablanca et disponible en paiement à la livraison (Cash on Delivery).',
      ],
    },
    privacy: {
      title: 'Politique de confidentialité (Loi 09-08)',
      paragraphs: [
        'Conformément à la loi marocaine n° 09-08 relative à la protection des personnes physiques à l’égard du traitement des données à caractère personnel, CasaVente protège strictement vos coordonnées.',
        'Vos données (nom, téléphone marocain, adresse, e-mail) sont utilisées exclusivement pour la préparation, la livraison et le suivi de vos commandes.',
        'Conformément à la loi, vous disposez d’un droit d’accès, de rectification et de suppression en écrivant à support@casavente.ma.',
      ],
    },
    returns: {
      title: 'Politique de retour et remboursement',
      paragraphs: [
        'Tout article acheté sur CasaVente peut être retourné ou échangé dans un délai de 14 jours suivant la réception, à condition qu’il soit non utilisé et dans son emballage d’origine complet.',
        'En cas de produit défectueux ou non conforme à la livraison, les frais de retour sont intégralement pris en charge par CasaVente.',
        'Le remboursement est effectué par virement bancaire marocain (RIB) ou avoir sous 5 jours ouvrés après inspection.',
      ],
    },
  }[type];

  useEffect(() => {
    document.title = `${content.title} | CasaVente Maroc`;
  }, [content.title]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-5">
      <h1 className="text-3xl font-bold text-[#142B4A]">{content.title}</h1>
      {content.paragraphs.map((p, idx) => (
        <p key={idx} className="text-slate-700 leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  );
}
