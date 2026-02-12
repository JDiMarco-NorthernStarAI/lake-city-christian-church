import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import whiteLogoPath from "@assets/White_Logo_1770933488639.png";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white px-4">
      <img
        src={whiteLogoPath}
        alt="Lake City Christian Church"
        className="w-24 h-24 object-contain mb-8 opacity-40"
      />
      <h1
        className="text-7xl font-extrabold mb-4 bg-gradient-to-r from-[#00D4FF] to-[#0033AA] bg-clip-text text-transparent"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        404
      </h1>
      <p
        className="text-xl font-bold mb-2"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        Page Not Found
      </p>
      <p className="text-white/60 mb-8 text-center max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button
          data-testid="link-home-404"
          className="text-white border-0"
          style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
        >
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
