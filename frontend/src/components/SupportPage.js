import { motion } from 'framer-motion';
import { Headset, Mail, MessageSquare, Phone, ShieldCheck } from 'lucide-react';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const contactChannels = [
  {
    title: 'Product Support',
    detail: 'support@nexorium.com',
    description: 'Account access, wallet linking, verification, and platform guidance.',
    icon: Mail,
  },
  {
    title: 'Rights & Licensing',
    detail: 'rights@nexorium.com',
    description: 'Ownership disputes, licensing requests, and royalty workflow questions.',
    icon: ShieldCheck,
  },
  {
    title: 'Priority Line',
    detail: '+1 (800) 555-0199',
    description: 'Time-sensitive creator assistance for urgent release and proof needs.',
    icon: Phone,
  },
];

export default function SupportPage() {
  const handleSubmit = (event) => {
    event.preventDefault();
    toast.success('Your message is ready to send through your support channel.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto px-6 sm:px-12 pt-24 pb-12"
      data-testid="support-page"
    >
      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <section className="premium-card rounded-lg p-7">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/12 border border-indigo-300/20 flex items-center justify-center">
              <Headset className="w-5 h-5 text-indigo-200" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#93C5FD] mb-2">Support</p>
              <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
                Contact Nexorium
              </h1>
              <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed">
                Reach the team for ownership questions, wallet issues, verification help, or licensing support.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {contactChannels.map(({ title, detail, description, icon: Icon }) => (
              <div key={title} className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-emerald-200" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white" style={{ fontFamily: 'Outfit' }}>{title}</p>
                    <p className="text-sm text-indigo-300 mt-1">{detail}</p>
                    <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="premium-card rounded-lg p-7">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/12 border border-emerald-300/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-emerald-200" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#93C5FD] mb-2">Message</p>
              <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
                Send Your Query
              </h2>
              <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed">
                Share the essentials so your issue can be routed to the right team quickly.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Full name"
                className="soft-input bg-white/[0.04] border border-white/10 text-white rounded-lg"
              />
              <Input
                type="email"
                placeholder="Email address"
                className="soft-input bg-white/[0.04] border border-white/10 text-white rounded-lg"
              />
            </div>
            <Input
              placeholder="Subject"
              className="soft-input bg-white/[0.04] border border-white/10 text-white rounded-lg"
            />
            <textarea
              rows={7}
              placeholder="Tell us what you need help with"
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#475569] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
            <button
              type="submit"
              className="premium-button text-white rounded-lg px-5 py-3 text-sm font-medium"
            >
              Send Support Request
            </button>
          </form>
        </section>
      </div>
    </motion.div>
  );
}
