import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SmsTerms() {
  return (
    <div className="min-h-screen bg-black pt-20 pb-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        <Link href="/">
          <Button variant="ghost" className="text-white/60 mb-6" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>

        <h1
          className="text-3xl font-bold text-white mb-8"
          style={{ fontFamily: "Montserrat, sans-serif" }}
          data-testid="text-sms-terms-title"
        >
          SMS Terms & Conditions
        </h1>

        <div className="space-y-6 text-white/80 text-sm leading-relaxed">
          <section>
            <h2 className="text-white text-lg font-semibold mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Program Description
            </h2>
            <p>
              Lake City Christian Church ("LC3", "we", "us", "our") offers a text messaging program to keep our
              church community informed about announcements, events, ministry updates, prayer requests, and
              other church-related communications. By opting in to our SMS program, you consent to receive
              these messages at the mobile phone number you provide.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Opt-In & Consent
            </h2>
            <p>
              By checking the SMS consent checkbox during registration, on your account profile, or by texting
              a keyword to our number, you are providing your express written consent to receive text messages
              from Lake City Christian Church. Consent is not a condition of any purchase or membership.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Message Frequency
            </h2>
            <p>
              Message frequency varies. You may receive up to 10 messages per month depending on church
              activities and events. Message frequency may increase during special events or holiday seasons.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Message & Data Rates
            </h2>
            <p>
              Message and data rates may apply. Your mobile carrier's standard messaging rates will apply to
              any messages you send or receive. Lake City Christian Church is not responsible for any charges
              incurred from your mobile carrier.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
              How to Opt Out
            </h2>
            <p>
              You can opt out of receiving text messages at any time by:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
              <li>Replying <span className="text-white font-medium">STOP</span> to any message you receive from us</li>
              <li>Unchecking the SMS consent option in your account profile settings</li>
              <li>Contacting us directly at the information provided below</li>
            </ul>
            <p className="mt-2">
              After opting out, you will receive one final confirmation message and will no longer receive
              text messages from us unless you opt in again.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
              How to Get Help
            </h2>
            <p>
              If you need assistance with our text messaging program, you can:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
              <li>Reply <span className="text-white font-medium">HELP</span> to any message you receive from us</li>
              <li>Email us at <a href="mailto:info@lc3.church" className="text-blue-400 hover:text-blue-300 underline">info@lc3.church</a></li>
              <li>Call our church office at <a href="tel:+14402349393" className="text-blue-400 hover:text-blue-300 underline">(440) 234-9393</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Privacy & Data Use
            </h2>
            <p>
              We respect your privacy. Your phone number and personal information will only be used to send
              you messages related to Lake City Christian Church communications. We will never sell, rent, or
              share your phone number or personal information with third parties for marketing purposes.
              Your information is stored securely and handled in accordance with applicable privacy laws.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Supported Carriers
            </h2>
            <p>
              Our messaging program is supported by all major US mobile carriers including AT&T, Verizon,
              T-Mobile, Sprint, and most other carriers. However, carrier support may vary and not all
              carriers guarantee delivery of messages.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Contact Us
            </h2>
            <p>
              Lake City Christian Church
              <br />
              7777 Pearl Road, Middleburg Heights, OH 44130
              <br />
              Phone: <a href="tel:+14402349393" className="text-blue-400 hover:text-blue-300 underline">(440) 234-9393</a>
              <br />
              Email: <a href="mailto:info@lc3.church" className="text-blue-400 hover:text-blue-300 underline">info@lc3.church</a>
            </p>
          </section>

          <section className="pt-4 border-t border-white/10">
            <p className="text-white/40 text-xs">
              Last updated: February 2026
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
