import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, ChevronDown, UserCircle, Shield, LogOut } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import wordsLogoPath from "@assets/Words_and_Logo_1770933488639.png";
import { useAuth } from "@/hooks/use-auth";
import { getAccessToken } from "@/lib/v1Api";

function getPhotoSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/objects/")) return url;
  if (url.startsWith("/")) return `/objects${url}`;
  return url;
}

function UserAvatar({ user, size = "sm" }: { user: { name?: string | null; profilePhotoUrl?: string | null }; size?: "sm" | "md" }) {
  const photoSrc = getPhotoSrc(user.profilePhotoUrl);
  const initials = (user.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const cls = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <Avatar className={cls} data-testid="user-avatar">
      {photoSrc && <AvatarImage src={photoSrc} alt={user.name || "User"} />}
      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
    </Avatar>
  );
}

const navItems = [
  { label: "Home", href: "/" },
  {
    label: "Who We Are",
    href: "/about",
    children: [
      { label: "Our Story", href: "/our-story" },
      { label: "What We Believe", href: "/what-we-believe" },
      { label: "Leadership", href: "/leadership" },
      { label: "Ministries", href: "/ministries" },
    ],
  },
  { label: "Give", href: "/give" },
  {
    label: "Plan Your Visit",
    href: "/plan-visit",
    children: [
      { label: "Sign Ups", href: "/signups" },
      { label: "Contact", href: "/contact" },
      { label: "Announcements", href: "/announcements" },
      { label: "Watch", href: "/encounter" },
    ],
  },
];

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleLogout() {
    await logout();
    setLocation("/");
    toast({ title: "Signed out" });
  }

  async function handleAdminClick(e: React.MouseEvent) {
    e.preventDefault();
    try {
      const token = getAccessToken();
      if (token) {
        const res = await fetch("/api/auth/bridge", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          window.location.href = "/admin/dashboard";
          return;
        }
      }
    } catch {}
    setLocation("/admin/dashboard");
  }

  const isActive = (href: string) => location === href;

  const isChildActive = (children?: { href: string }[]) =>
    children?.some((child) => location === child.href) ?? false;

  return (
    <nav
      data-testid="navbar"
      className={`fixed top-0 left-0 right-0 z-50 bg-black transition-all duration-300 ${
        scrolled ? "border-b border-white/10 bg-black/95" : "bg-black/90"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <Link href="/" data-testid="link-logo">
          <img
            src={wordsLogoPath}
            alt="Lake City Christian Church"
            className="h-auto w-[140px] md:w-[180px]"
            data-testid="img-logo"
          />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) =>
            item.children ? (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`text-sm font-medium text-white/80 no-default-hover-elevate no-default-active-elevate ${
                      isActive(item.href) || isChildActive(item.children)
                        ? "text-white"
                        : "hover:text-white"
                    }`}
                    data-testid={`nav-dropdown-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {item.label}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="border-white/10 bg-black/95 backdrop-blur-md"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href={item.href}
                      className="cursor-pointer text-white/70 focus:bg-white/10 focus:text-white"
                      data-testid={`nav-link-${item.href.replace(/\//g, "").replace(/\s+/g, "-") || "home"}`}
                    >
                      {item.label} Overview
                    </Link>
                  </DropdownMenuItem>
                  {item.children.map((child) => (
                    <DropdownMenuItem key={child.href} asChild>
                      <Link
                        href={child.href}
                        className={`cursor-pointer focus:bg-white/10 focus:text-white ${
                          isActive(child.href)
                            ? "text-white"
                            : "text-white/70"
                        }`}
                        data-testid={`nav-link-${child.href.replace(/\//g, "")}`}
                      >
                        {child.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`text-sm font-medium no-default-hover-elevate no-default-active-elevate ${
                    isActive(item.href)
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                  }`}
                  data-testid={`nav-link-${item.href.replace(/\//g, "") || "home"}`}
                >
                  {item.label}
                </Button>
              </Link>
            )
          )}
          {!authLoading && (
            isAuthenticated ? (
              <>
                {user?.roles && (user.roles.includes("admin") || user.roles.includes("super_admin")) && (
                  <a href="/admin/dashboard" onClick={handleAdminClick}>
                    <Button
                      variant="ghost"
                      className={`text-sm font-medium no-default-hover-elevate no-default-active-elevate ${
                        location.startsWith("/admin")
                          ? "text-white"
                          : "text-white/70 hover:text-white"
                      }`}
                      data-testid="nav-link-admin"
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      Admin
                    </Button>
                  </a>
                )}
                <Link href="/account">
                  <Button
                    variant="ghost"
                    className={`text-sm font-medium no-default-hover-elevate no-default-active-elevate ${
                      isActive("/account")
                        ? "text-white"
                        : "text-white/70 hover:text-white"
                    }`}
                    data-testid="nav-link-account"
                  >
                    {user?.profilePhotoUrl ? (
                      <UserAvatar user={user} size="sm" />
                    ) : (
                      <UserCircle className="w-4 h-4 mr-1" />
                    )}
                    {user?.name?.split(" ")[0] || "Account"}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-white/70 hover:text-white no-default-hover-elevate no-default-active-elevate"
                  onClick={handleLogout}
                  data-testid="nav-link-logout"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Log Out
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-white/70 hover:text-white no-default-hover-elevate no-default-active-elevate"
                  data-testid="nav-link-login"
                >
                  Sign In
                </Button>
              </Link>
            )
          )}
        </div>

        <div className="lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white no-default-hover-elevate"
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] border-white/10 bg-black p-0"
            >
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col gap-1 px-4 pt-14 pb-6">
                <Link href="/" data-testid="mobile-link-logo">
                  <img
                    src={wordsLogoPath}
                    alt="Lake City Christian Church"
                    className="mb-6 h-auto w-[140px]"
                  />
                </Link>

                {navItems.map((item) =>
                  item.children ? (
                    <MobileDropdown
                      key={item.label}
                      item={item}
                      isActive={isActive}
                      isChildActive={isChildActive}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      data-testid={`mobile-link-${item.href.replace(/\//g, "") || "home"}`}
                    >
                      <span
                        className={`block rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive(item.href)
                            ? "text-white"
                            : "text-white/70 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  )
                )}
                <div className="mt-4 pt-4 border-t border-white/10">
                  {!authLoading && (
                    isAuthenticated ? (
                      <>
                        {user?.roles && (user.roles.includes("admin") || user.roles.includes("super_admin")) && (
                          <a
                            href="/admin/dashboard"
                            onClick={(e) => { setMobileOpen(false); handleAdminClick(e); }}
                            data-testid="mobile-link-admin"
                          >
                            <span className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white">
                              <Shield className="w-4 h-4" />
                              Admin
                            </span>
                          </a>
                        )}
                        <Link
                          href="/account"
                          onClick={() => setMobileOpen(false)}
                          data-testid="mobile-link-account"
                        >
                          <span className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white">
                            {user?.profilePhotoUrl ? (
                              <UserAvatar user={user} size="sm" />
                            ) : (
                              <UserCircle className="w-4 h-4" />
                            )}
                            My Account
                          </span>
                        </Link>
                        <button
                          onClick={() => { setMobileOpen(false); handleLogout(); }}
                          className="w-full"
                          data-testid="mobile-link-logout"
                        >
                          <span className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white">
                            <LogOut className="w-4 h-4" />
                            Log Out
                          </span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setMobileOpen(false)}
                          data-testid="mobile-link-login"
                        >
                          <span className="block rounded-md px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white">
                            Sign In
                          </span>
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setMobileOpen(false)}
                          data-testid="mobile-link-register"
                        >
                          <span className="block rounded-md px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white">
                            Create Account
                          </span>
                        </Link>
                      </>
                    )
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

function MobileDropdown({
  item,
  isActive,
  isChildActive,
  onNavigate,
}: {
  item: {
    label: string;
    href: string;
    children: { label: string; href: string }[];
  };
  isActive: (href: string) => boolean;
  isChildActive: (children?: { href: string }[]) => boolean;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive(item.href) || isChildActive(item.children)
            ? "text-white"
            : "text-white/70 hover:text-white"
        }`}
        data-testid={`mobile-dropdown-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {item.label}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
          <Link
            href={item.href}
            onClick={onNavigate}
            data-testid={`mobile-link-${item.href.replace(/\//g, "")}`}
          >
            <span
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                isActive(item.href)
                  ? "text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {item.label} Overview
            </span>
          </Link>
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onNavigate}
              data-testid={`mobile-link-${child.href.replace(/\//g, "")}`}
            >
              <span
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive(child.href)
                    ? "text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {child.label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
