import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { GstSettingsForm } from "./GstSettingsForm";
import { ThemeSettingsForm } from "./ThemeSettingsForm";
import { BannerImageForm } from "./BannerImageForm";
import { BANNER_SLIDES } from "@/lib/banners";
import { isThemeColor, DEFAULT_THEME_COLOR } from "@/lib/theme";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/admin/login");

  const [settings, bannerImageRows] = await Promise.all([
    prisma.appSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    }),
    prisma.bannerImage.findMany({ orderBy: [{ slot: "asc" }, { sortOrder: "asc" }] }),
  ]);

  const bannerImages: Record<number, { id: string; imageUrl: string }[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const img of bannerImageRows) {
    bannerImages[img.slot]?.push({ id: img.id, imageUrl: img.imageUrl });
  }

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-xl font-bold text-brand-navy">Settings</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Payment Deadline</h2>
        <p className="text-xs text-gray-500 mb-4">
          Orders left in &quot;Payment Processing&quot; with no payment slip uploaded are
          automatically cancelled after this many days.
        </p>
        <SettingsForm initialDays={settings.paymentDeadlineDays} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">GST Rate</h2>
        <p className="text-xs text-gray-500 mb-4">
          The single shop-wide GST rate, used to calculate GST-inclusive prices for products and
          purchase invoices wherever GST applies.
        </p>
        <GstSettingsForm initialPercent={settings.gstPercent} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">App Theme Color</h2>
        <p className="text-xs text-gray-500 mb-4">
          Pick the accent color used for buttons, links and highlights across the whole site.
        </p>
        <ThemeSettingsForm
          initialColor={isThemeColor(settings.themeColor) ? settings.themeColor : DEFAULT_THEME_COLOR}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Homepage Banners</h2>
        <p className="text-xs text-gray-500 mb-2">
          Upload one or more images (or paste URLs) for each banner. With more than one, the
          banner automatically cycles through them. Leave a banner empty to keep its default
          gradient background.
        </p>
        {BANNER_SLIDES.map((s) => (
          <BannerImageForm
            key={s.slot}
            slot={s.slot}
            title={s.title}
            subtitle={s.subtitle}
            initialImages={bannerImages[s.slot] ?? []}
          />
        ))}
      </div>
    </div>
  );
}
