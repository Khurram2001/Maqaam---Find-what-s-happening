"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, LayoutList, LogOut, UserRound } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/** @param {{ user: { name: string; email: string }; onLogout: () => void | Promise<void>; heroOverlay?: boolean }} props */
export function UserMenu({ user, onLogout, heroOverlay = false }) {
  const router = useRouter();

  async function handleSignOut() {
    await apiJson("/auth/logout", { method: "POST" });
    await onLogout();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-9 max-w-[14rem] gap-1.5 rounded-full px-2.5 font-normal sm:h-10 sm:px-3",
          heroOverlay
            ? "border-white/25 bg-transparent text-white shadow-none hover:border-white/45 hover:bg-white/10"
            : "border-[#0B4D53]/20 bg-white/80 text-[#0B4D53] hover:bg-white"
        )}
      >
        <UserRound
          className={cn("size-4 shrink-0", heroOverlay ? "text-white/80" : "text-[#0B4D53]/70")}
          aria-hidden
        />
        <span className="truncate text-sm">{user.name}</span>
        <ChevronDown
          className={cn("size-3.5 shrink-0", heroOverlay ? "text-white/70" : "text-[#0B4D53]/60")}
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-xs font-medium text-foreground">{user.name}</span>
            <span className="block truncate text-[0.65rem] font-normal text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2"
            onClick={() => {
              router.push("/my-events");
            }}
          >
            <LayoutList className="size-4" />
            My events
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut} className="gap-2">
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
