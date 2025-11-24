import { type FormEvent, useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import Section from "../components/ui/Section";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Button from "../components/ui/Button";
import ContactMap from "../components/contact/ContactMap";

const ContactPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Demo-only: no real sending here.
    setSubmitted(true);
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Contact & Location"
        title="Get in touch with the shop"
        subtitle="Questions about bookings, services, or anything else? Send us a message or visit us in person."
      />
      <Section className="space-y-3 rounded-2xl bg-neutral-900 border-2 border-amber-500/40 shadow-lg p-6 grid gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start">
        <Card
          title="Send a message"
          subtitle="Drop us a line and we’ll respond as soon as we can."
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <Textarea
              label="Message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="Tell us how we can help…"
              helper=""
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submitted}
              >
                {submitted ? "Message sent" : "Send message"}
              </Button>

              {submitted && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1">
                  Demo only – your message was not actually sent, but the UI
                  flow is working.
                </p>
              )}
            </div>
          </form>
        </Card>

        {/* Shop details + map */}
        <div className="space-y-4">
          <Card title="Shop details">
            <div className="space-y-3 text-sm text-neutral-700">
              <div>
                <p className="font-medium text-neutral-900">
                  BarberBooking Barbershop
                </p>
                <p>Sample Street 123</p>
                <p>40210 Düsseldorf</p>
              </div>

              <div className="space-y-1">
                <p>
                  Phone:{" "}
                  <a
                    href="tel:+490000000000"
                    className="text-neutral-900 underline underline-offset-2"
                  >
                    +49 0000 000000
                  </a>
                </p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:info@example.com"
                    className="text-neutral-900 underline underline-offset-2"
                  >
                    info@example.com
                  </a>
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-neutral-900">
                  Walk-in & bookings
                </p>
                <p>
                  We accept walk-ins when possible, but booking online is
                  recommended to secure your slot.
                </p>
              </div>
            </div>
          </Card>
          <ContactMap />
        </div>
      </Section>
    </div>
  );
};

export default ContactPage;
