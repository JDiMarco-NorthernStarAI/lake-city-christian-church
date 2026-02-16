import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Heart, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function GiveSuccess() {
  return (
    <div className="min-h-screen">
      <section className="relative flex items-center justify-center min-h-[50vh] bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/60" />
        <div className="relative z-10 text-center px-4 py-20">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            data-testid="text-success-title"
          >
            Thank You!
          </motion.h1>
          <motion.div
            className="w-16 h-1 mx-auto rounded-full"
            style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          />
        </div>
      </section>

      <section className="bg-white py-20 md:py-24 px-4">
        <motion.div
          className="max-w-lg mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>

              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: "Montserrat, sans-serif" }}
                data-testid="text-success-heading"
              >
                Your Donation Was Successful
              </h2>

              <p className="text-muted-foreground mb-2" data-testid="text-success-message">
                Thank you for your generous gift to Lake City Christian Church.
                Your support helps us connect people to a life-changing relationship with Jesus.
              </p>

              <p className="text-sm text-muted-foreground mb-8">
                A receipt has been sent to your email address. Your donation may be tax-deductible.
              </p>

              <div className="flex flex-col gap-3">
                <Link href="/give">
                  <Button
                    variant="outline"
                    className="w-full"
                    data-testid="button-give-again"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Give Again
                  </Button>
                </Link>
                <Link href="/">
                  <Button
                    variant="ghost"
                    className="w-full"
                    data-testid="button-back-home"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
