"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./button";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Users,
  GitFork,
  Wallet,
  LogOut,
  User,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { useEffect, useState } from "react";
import { useMetaMaskStore } from "@/lib/stores/metamask-store";

const routes = [
  // {
  //   label: "Dashboard",
  //   icon: LayoutDashboard,
  //   href: "/dashboard",
  // },
  {
    label: "Courses",
    icon: BookOpen,
    href: "/courses",
  },
  {
    label: "My Courses",
    icon: GitFork,
    href: "/my-courses",
  },
  {
    label: "Challenges",
    icon: Trophy,

    href: "/contests",
  },
  {
    label: "Community",
    icon: Users,
    href: "/community",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { metaMaskIsConnected, walletAddress, connectMetaMask, disconnectMetaMask } = useMetaMaskStore();

  useEffect(() => {
    if (walletAddress && walletAddress !== null) {
      localStorage.setItem('walletAddress', walletAddress);
    }
  }, [walletAddress]);
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3 md:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-x-3">
            <Link href="/" className="flex items-center gap-x-2">
              <div className="text-white w-8 h-8">
                <svg viewBox="0 0 32 32" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32ZM12.4306 9.70695C12.742 9.33317 13.2633 9.30058 13.6052 9.62118L19.1798 14.8165C19.4894 15.1054 19.4894 15.5841 19.1798 15.873L13.6052 21.0683C13.2633 21.3889 12.742 21.3563 12.4306 19.9991V9.70695Z"
                  />
                </svg>
              </div>
              <span className="font-bold text-xl text-white funnel-font">
                OnlyNerds
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-x-6">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm funnel-font group flex items-center gap-x-2 py-2 px-3 rounded-md transition-colors hover:bg-white/10",
                  pathname === route.href
                    ? "text-white bg-white/10"
                    : "text-zinc-400"
                )}
              >
                <route.icon className="w-4 h-4" />
                {route.label}
              </Link>
            ))}

            {/* Desktop Wallet Connection */}
            {!metaMaskIsConnected ? (
              <Button
                size="sm"
                variant="outline"
                className="gap-x-2 border-primary text-primary hover:10 funnel-font"
                onClick={connectMetaMask}
              >
                <Wallet className="w-4 h-4" />
                Connect MetaMask
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-x-2 border-primary text-primary hover:bg-white/3 funnel-font"
                  >
                    <Wallet className="w-4 h-4" />
                    {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem>
                    <Link href="/profile" className="flex items-center gap-x-2">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={disconnectMetaMask}>
                    <div className="flex items-center gap-x-2">
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={cn(
            "md:hidden fixed inset-x-0 top-[57px] bg-black/95 backdrop-blur-sm transition-opacity duration-200 ease-in-out",
            isMobileMenuOpen
              ? "opacity-100 visible"
              : "opacity-0 invisible"
          )}
        >
          <div className="container px-4 py-4">
            <div className="flex flex-col gap-y-4">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "text-sm funnel-font flex items-center gap-x-2 py-2 px-3 rounded-md transition-colors hover:bg-white/10",
                    pathname === route.href
                      ? "text-white bg-white/10"
                      : "text-zinc-400"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <route.icon className="w-4 h-4" />
                  {route.label}
                </Link>
              ))}

              {/* Mobile Wallet Connection */}
              {!metaMaskIsConnected ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-x-2 border-primary text-primary hover:bg-primary/10 funnel-font mt-2"
                  onClick={connectMetaMask}
                >
                  <Wallet className="w-4 h-4" />
                  Connect MetaMask
                </Button>
              ) : (
                <div className="mt-2">
                  <Link
                    href="/profile"
                    className="text-sm funnel-font flex items-center gap-x-2 py-2 px-3 rounded-md transition-colors hover:bg-white text-zinc-400"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <button
                    className="text-sm funnel-font flex items-center gap-x-2 py-2 px-3 rounded-md transition-colors hover:bg-red-500/10 text-red-500 w-full mt-2"
                    onClick={() => {
                      disconnectMetaMask();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}