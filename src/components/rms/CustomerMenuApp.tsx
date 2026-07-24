"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Coffee, Plus, Minus, Search, Send, CheckCircle2, Clock, X, Phone, Utensils, Loader2, QrCode,
} from "lucide-react";
import { MenuItem, Category, CafeTable, SiteSettings } from "@/types";
import { DEFAULT_SETTINGS, DEFAULT_CATEGORIES, DEFAULT_MENU_ITEMS } from "@/lib/initial-data";

interface CartEntry {
  menuItemId: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  notes: string;
}

export default function CustomerMenuApp() {
  const searchParams = useSearchParams();
  const tableId = Number(searchParams.get("table") || 0);

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS as SiteSettings);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES as Category[]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS as MenuItem[]);
  const [tableName, setTableName] = useState(tableId ? `Table ${tableId}` : "");

  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const logoUrl = String(settings.logo_url || "/logo.png");

  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/seed");
        const [s, c, m, t] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/categories"),
          fetch("/api/menu"),
          fetch("/api/tables"),
        ]);
        if (s.ok) setSettings(await s.json());
        if (c.ok) setCategories(await c.json());
        if (m.ok) setMenuItems(await m.json());
        if (t.ok) {
          const tables: CafeTable[] = await t.json();
          const found = tables.find((x) => x.id === tableId);
          if (found) setTableName(found.name);
        }
      } catch {}
    })();
  }, [tableId]);

  const filteredMenu = useMemo(
    () =>
      menuItems.filter(
        (m) =>
          (category === "all" || m.category === category) &&
          m.name.toLowerCase().includes(search.toLowerCase())
      ),
    [menuItems, category, search]
  );

  const addToCart = (m: MenuItem) => {
    if (!m.isAvailable) return;
    setCart((prev) => {
      const ex = prev.find((c) => c.menuItemId === m.id);
      if (ex) return prev.map((c) => (c.menuItemId === m.id ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { menuItemId: m.id, name: m.name, category: m.category, price: m.price, quantity: 1, notes: "" }];
    });
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const submitOrder = async () => {
    if (cart.length === 0 || !tableId) return;
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          source: "customer",
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            name: c.name,
            category: c.category,
            price: c.price,
            quantity: c.quantity,
            notes: c.notes,
          })),
        }),
      });
      if (r.ok) {
        setSubmitted(true);
        setCart([]);
        setReviewMode(false);
      } else {
        const d = await r.json();
        setError(d.error || "Could not submit order. Please call your waiter.");
      }
    } catch {
      setError("Connection issue. Please call your waiter.");
    } finally {
      setSubmitting(false);
    }
  };

  const phone = settings.phone || "0911 065 022";

  /* ── Submitted confirmation ── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border-2 border-[#C9A227] p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2C1B17]">Order Request Sent!</h1>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
            <p className="text-sm font-bold text-[#2C1B17] flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4 text-[#C9A227]" /> Waiting for Waiter Confirmation
            </p>
            <p className="text-xs text-stone-600">
              Your waiter is walking to <strong>{tableName}</strong> to confirm your order. Once confirmed, preparation starts immediately.
            </p>
          </div>
          <p className="text-xs text-stone-500">Want to add more? You can scan & order again anytime — it joins your table's bill automatically.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="w-full bg-[#4E342E] text-amber-200 font-bold text-sm py-3.5 rounded-xl"
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    );
  }

  /* ── Invalid table ── */
  if (!tableId) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-[#C9A227]/40 space-y-3">
          <QrCode className="w-10 h-10 text-[#C9A227] mx-auto" />
          <h1 className="font-serif text-xl font-bold">Scan a Table QR Code</h1>
          <p className="text-sm text-stone-600">Please scan the QR code on your table to open your table's ordering menu.</p>
        </div>
      </div>
    );
  }

  /* ── REVIEW MODE (before submit) ── */
  if (reviewMode) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] pb-32">
        <header className="bg-[#2C1B17] text-white sticky top-0 z-40 px-4 py-3 flex items-center gap-3 shadow-xl">
          <button onClick={() => setReviewMode(false)} className="text-amber-200"><X className="w-5 h-5" /></button>
          <h1 className="font-serif font-bold">Review Your Order — {tableName}</h1>
        </header>

        <div className="max-w-lg mx-auto p-4 space-y-3">
          {error && <div className="bg-rose-100 border border-rose-300 text-rose-700 text-xs p-3 rounded-xl">{error}</div>}

          {cart.map((c) => (
            <div key={c.menuItemId} className="bg-white rounded-2xl border border-[#C9A227]/30 p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-bold text-[#2C1B17] text-sm">{c.name}</p>
                <p className="font-extrabold text-[#4E342E]">{c.price * c.quantity} ETB</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCart(cart.map((x) => (x.menuItemId === c.menuItemId ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x)))}
                  className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-extrabold w-5 text-center text-[#2C1B17]">{c.quantity}</span>
                <button
                  onClick={() => setCart(cart.map((x) => (x.menuItemId === c.menuItemId ? { ...x, quantity: x.quantity + 1 } : x)))}
                  className="w-7 h-7 rounded-lg bg-[#C9A227] flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setCart(cart.filter((x) => x.menuItemId !== c.menuItemId))} className="ml-auto text-rose-500 text-xs font-bold">
                  Remove
                </button>
              </div>
              <input
                value={c.notes}
                onChange={(e) => setCart(cart.map((x) => (x.menuItemId === c.menuItemId ? { ...x, notes: e.target.value } : x)))}
                placeholder="📝 Note: No Sugar, Less Ice, Extra Mayo..."
                className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-[#2C1B17] placeholder-stone-400"
              />
            </div>
          ))}
        </div>

        {/* submit bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#2C1B17] border-t-2 border-[#C9A227] p-4">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-stone-400 uppercase font-bold">{cartCount} item(s)</p>
              <p className="font-serif font-black text-xl text-[#C9A227]">{cartTotal} ETB</p>
            </div>
            <button
              onClick={submitOrder}
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-[#C9A227] to-amber-500 text-[#2C1B17] font-black text-sm uppercase py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Sending..." : "Submit Order"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN MENU ── */
  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-28">
      {/* Header with logo */}
      <header className="bg-[#2C1B17] text-white sticky top-0 z-40 shadow-xl">
        <div className="px-4 py-2.5 flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <img src={logoUrl} alt="Fana" className="w-10 h-10 rounded-full object-cover bg-white p-0.5" />
            <div>
              <p className="font-serif font-bold text-sm text-amber-100 leading-none">{settings.cafe_name || "Fana Cafe"}</p>
              <p className="text-[10px] text-[#C9A227] font-bold uppercase tracking-wider">Menu • {tableName}</p>
            </div>
          </div>
          <a href={`tel:${phone.replace(/\s+/g, "")}`} className="flex items-center gap-1 bg-[#C9A227] text-[#2C1B17] text-[11px] font-extrabold px-3 py-1.5 rounded-full">
            <Phone className="w-3 h-3" /> Waiter
          </a>
        </div>
      </header>

      {/* intro */}
      <div className="bg-gradient-to-r from-[#4E342E] to-[#2C1B17] text-amber-100 text-center text-xs py-2.5 px-4">
        Pick your items, add notes, then <strong>Submit Order</strong> — your waiter will confirm at your table.
      </div>

      {/* search + categories */}
      <div className="sticky top-[61px] z-30 bg-[#FAF6F0] px-4 pt-3 pb-2 space-y-2 max-w-lg mx-auto">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drinks, meals, pastries..."
            className="w-full bg-white border border-[#C9A227]/40 rounded-xl pl-9 pr-3 py-2.5 text-sm shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                category === c.slug ? "bg-[#4E342E] text-amber-200 border-[#C9A227]" : "bg-white text-stone-600 border-stone-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* menu grid */}
      <div className="px-4 grid grid-cols-2 gap-3 max-w-lg mx-auto">
        {filteredMenu.map((m) => {
          const inCart = cart.find((c) => c.menuItemId === m.id);
          const out = !m.isAvailable;
          return (
            <div key={m.id} className={`bg-white rounded-2xl overflow-hidden border shadow-sm ${out ? "opacity-60 border-stone-200" : "border-[#C9A227]/25"}`}>
              <div className="relative">
                <img src={m.imageUrl} alt={m.name} className="w-full h-28 object-cover" />
                {out && (
                  <span className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                    Out of Stock
                  </span>
                )}
              </div>
              <div className="p-3 space-y-1.5">
                <p className="text-xs font-bold text-[#2C1B17] leading-tight line-clamp-2 min-h-[2rem]">{m.name}</p>
                <p className="text-[10px] text-stone-500 line-clamp-2">{m.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-extrabold text-[#4E342E] text-sm">{m.price} ETB</span>
                  {out ? (
                    <span className="text-[10px] text-stone-400 font-bold">—</span>
                  ) : (
                    <button
                      onClick={() => addToCart(m)}
                      className={`text-[11px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${
                        inCart ? "bg-emerald-600 text-white" : "bg-[#C9A227] text-[#2C1B17]"
                      }`}
                    >
                      <Plus className="w-3 h-3" /> {inCart ? `+${inCart.quantity}` : "Add"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredMenu.length === 0 && (
          <div className="col-span-2 text-center py-12 text-stone-400 text-sm">
            <Utensils className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            Nothing found in this category.
          </div>
        )}
      </div>

      {/* cart bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#2C1B17] border-t-2 border-[#C9A227] p-4">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-stone-400 uppercase font-bold">{cartCount} item(s)</p>
              <p className="font-serif font-black text-xl text-[#C9A227]">{cartTotal} ETB</p>
            </div>
            <button
              onClick={() => setReviewMode(true)}
              className="flex-1 bg-gradient-to-r from-[#C9A227] to-amber-500 text-[#2C1B17] font-black text-sm uppercase py-3.5 rounded-xl flex items-center justify-center gap-2"
            >
              <Coffee className="w-4 h-4" /> Review Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
