"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#1e1035]/92 group-[.toaster]:text-slate-100 group-[.toaster]:border-purple-500/40 group-[.toaster]:shadow-2xl group-[.toaster]:shadow-purple-950/50 group-[.toaster]:backdrop-blur-md group-[.toaster]:rounded-xl group-[.toaster]:p-4 group-[.toaster]:text-xs group-[.toaster]:font-semibold",
          description: "group-[.toast]:text-purple-200/80 group-[.toast]:font-normal",
          actionButton:
            "group-[.toast]:bg-teal-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-700 group-[.toast]:text-white",
          success:
            "group-[.toaster]:border-emerald-500/40 group-[.toast]:text-white",
          error:
            "group-[.toaster]:border-rose-500/40 group-[.toast]:text-white",
          warning:
            "group-[.toaster]:border-amber-500/40 group-[.toast]:text-white",
          info:
            "group-[.toaster]:border-purple-400/50 group-[.toast]:text-white",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4.5 text-emerald-400 shrink-0" />,
        info: <InfoIcon className="size-4.5 text-purple-300 shrink-0" />,
        warning: <TriangleAlertIcon className="size-4.5 text-amber-400 shrink-0" />,
        error: <OctagonXIcon className="size-4.5 text-rose-400 shrink-0" />,
        loading: <Loader2Icon className="size-4.5 animate-spin text-teal-400 shrink-0" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
