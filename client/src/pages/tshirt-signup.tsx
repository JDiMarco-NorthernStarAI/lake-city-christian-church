import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TshirtSignup() {
  return (
    <div className="min-h-screen bg-black pt-20 pb-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        <Link href="/">
          <Button variant="ghost" className="text-white/60 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>

        <h1
          className="text-3xl font-bold text-white mb-8"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          T-Shirt Sign Up
        </h1>

        <div className="w-full rounded-lg overflow-hidden">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSdtZNul6BL8DdFdAlpab3oHhrRrtCx__HyGOyYXf3OsqToiVQ/viewform?embedded=true"
            width="100%"
            height="1200"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            className="bg-white rounded-lg"
          >
            Loading...
          </iframe>
        </div>
      </motion.div>
    </div>
  );
}
