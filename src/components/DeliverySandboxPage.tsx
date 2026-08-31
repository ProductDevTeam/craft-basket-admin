import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Truck,
  CreditCard,
  ShoppingBag,
  User,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Package,
  Minus,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

async function call(method: string, path: string, token?: string, body?: unknown) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  basePrice: number;
  vendor: string | { id: string; vendorInfo?: { businessName?: string }; firstName?: string };
  images?: { url: string }[];
}

interface CartEntry {
  product: Product;
  qty: number;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus: string;
  deliveryId?: string;
  deliveryRaw?: { trackingLink?: string };
}

// Extract vendor ID string whether vendor is a populated object or a raw ID string
function vendorId(p: Product): string {
  if (!p.vendor) return '';
  return typeof p.vendor === 'object' ? p.vendor.id : p.vendor;
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 'login', label: 'Login', icon: User },
  { id: 'product', label: 'Product', icon: ShoppingBag },
  { id: 'shipping', label: 'Shipping', icon: MapPin },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'tracking', label: 'Tracking', icon: Truck },
];

// ─── Lagos areas (mirrors kwikService LAGOS_COORDS keys) ─────────────────────

const LAGOS_AREAS = [
  'Lekki Phase 1',
  'Lekki Phase 2',
  'Victoria Island',
  'Ikoyi',
  'Ajah',
  'Sangotedo',
  'Chevron',
  'Jakande',
  'Ikeja',
  'Allen Avenue',
  'Alausa',
  'Maryland',
  'Ojota',
  'Gbagada',
  'Ogudu',
  'Ogudu GRA',
  'Yaba',
  'Surulere',
  'Lagos Island',
  'Isale Eko',
  'Apapa',
  'Mushin',
  'Oshodi',
  'Festac Town',
  'Ikorodu',
  'Agege',
  'Ogba',
  'Magodo',
  'Berger',
  'Ojodu',
  'Epe',
  'Badagry',
].sort();

// ─── Street autocomplete (Mapbox Geocoding API) ───────────────────────────────

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

interface MapboxFeature {
  place_name: string;
  text: string;
  address?: string;
}

function StreetAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (street: string) => void;
}) {
  const [query, setQuery] = React.useState(value);
  const [suggestions, setSuggestions] = React.useState<MapboxFeature[]>([]);
  const [open, setOpen] = React.useState(false);
  const [fetching, setFetching] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = (q: string) => {
    if (!MAPBOX_TOKEN || q.length < 3) {
      setSuggestions([]);
      return;
    }
    setFetching(true);
    const encoded = encodeURIComponent(q);
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      bbox: '3.0,6.2,3.7,6.8',
      proximity: '3.3792,6.5244',
      types: 'address',
      limit: '6',
      language: 'en',
    });
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?${params}`)
      .then((r) => r.json())
      .then((res: { features?: MapboxFeature[] }) => {
        setSuggestions(res.features ?? []);
        setOpen(true);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  const select = (f: MapboxFeature) => {
    // Compose street as "24 Aroyewun Street" from address + text
    const street = f.address ? `${f.address} ${f.text}` : f.text;
    setQuery(street);
    onChange(street);
    setSuggestions([]);
    setOpen(false);
  };

  // Context = everything after the first comma in place_name (area, city)
  const context = (f: MapboxFeature) => {
    const idx = f.place_name.indexOf(',');
    return idx !== -1 ? f.place_name.slice(idx + 1).trim() : '';
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={query}
          placeholder="e.g. 24 Aroyewun Street"
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {fetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-gray-400" />
        )}
      </div>
      {!MAPBOX_TOKEN && (
        <p className="text-[10px] text-amber-500 mt-1">
          Add VITE_MAPBOX_TOKEN to .env to enable suggestions.
        </p>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden text-sm">
          {suggestions.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              onMouseDown={() => select(f)}
            >
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-gray-900 block leading-tight">
                  {f.address ? `${f.address} ${f.text}` : f.text}
                </span>
                <span className="text-gray-400 text-xs block mt-0.5 truncate">{context(f)}</span>
              </div>
            </li>
          ))}
          {/* <li className="px-4 py-2 text-[10px] text-gray-400 bg-gray-50 text-right select-none">
            Powered by Mapbox
          </li> */}
        </ul>
      )}
    </div>
  );
}

// ─── City autocomplete component ─────────────────────────────────────────────

function CityAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (city: string) => void;
}) {
  const [query, setQuery] = React.useState(value);
  const [open, setOpen] = React.useState(false);
  const filtered =
    query.length > 0
      ? LAGOS_AREAS.filter((a) => a.toLowerCase().includes(query.toLowerCase()))
      : LAGOS_AREAS;

  return (
    <div className="relative">
      <Input
        value={query}
        placeholder="Type to search Lagos area..."
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto text-sm">
          {filtered.map((area) => (
            <li
              key={area}
              className="px-3 py-2 cursor-pointer hover:bg-orange-50 hover:text-ebunly-orange"
              onMouseDown={() => {
                setQuery(area);
                onChange(area);
                setOpen(false);
              }}
            >
              {area}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DeliverySandboxPage() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data across steps
  const [token, setToken] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorNames, setVendorNames] = useState<Record<string, string>>({});
  // cart: productId → { product, qty }
  const [cart, setCart] = useState<Map<string, CartEntry>>(new Map());
  const [order, setOrder] = useState<Order | null>(null);
  const [payRef, setPayRef] = useState('');
  const [payUrl, setPayUrl] = useState('');
  const [trackingLink, setTrackingLink] = useState('');
  const [jobId, setJobId] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState<{
    cost: number;
    breakdown?: {
      baseFare: number;
      distanceFee: number;
      timeFee: number;
      distanceKm: number;
      estimatedMinutes: number;
    };
  } | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  // Login form
  const [email, setEmail] = useState('customer@example.com');
  const [password, setPassword] = useState('customer123');

  // Shipping form
  const [shipping, setShipping] = useState({
    fullName: 'Test Customer',
    street: '24 Aroyewun Street',
    city: 'Ogudu GRA',
    state: 'Lagos',
    zipCode: '100001',
    country: 'Nigeria',
    phone: '08067919915',
  });

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef(''); // mirrors `token` state — safe to use in async closures

  const go = useCallback(
    (nextStep: number) => {
      setDir(nextStep > step ? 1 : -1);
      setError('');
      setStep(nextStep);
    },
    [step]
  );

  const reset = () => {
    pollingRef.current && clearInterval(pollingRef.current);
    tokenRef.current = '';
    setStep(0);
    setDir(1);
    setLoading(false);
    setError('');
    setToken('');
    setCustomerName('');
    setCart(new Map());
    setOrder(null);
    setPayRef('');
    setPayUrl('');
    setTrackingLink('');
    setJobId('');
    setDeliveryStatus('');
    setPollCount(0);
  };

  // Fetch products when reaching step 1 — vendor name comes from populated vendor field
  useEffect(() => {
    if (step !== 1 || products.length > 0) return;
    call('GET', '/products?limit=8')
      .then((d) => {
        const list: Product[] = Array.isArray(d.data) ? d.data : (d.data?.products ?? []);
        setProducts(list);
        // Extract vendor names from populated vendor object (no extra requests needed)
        const names: Record<string, string> = {};
        list.forEach((p, i) => {
          const vid = vendorId(p);
          if (!names[vid]) {
            const v = typeof p.vendor === 'object' ? p.vendor : null;
            names[vid] =
              v?.vendorInfo?.businessName ??
              v?.firstName ??
              `Vendor ${String.fromCharCode(65 + i)}`;
          }
        });
        setVendorNames(names);
      })
      .catch(() => {});
  }, [step, products.length]);

  // Fetch real delivery cost when on shipping step
  useEffect(() => {
    if (step !== 2) return;
    const vendorCount = new Set([...cart.values()].map((e) => vendorId(e.product))).size;
    setFeeLoading(true);
    const params = new URLSearchParams({
      state: shipping.state,
      city: shipping.city,
      vendors: String(vendorCount),
    });
    call('GET', `/deliveries/cost?${params}`)
      .then((d) => {
        setDeliveryFee({ cost: d.data.cost, breakdown: d.data.breakdown });
      })
      .catch(() => {
        setDeliveryFee({ cost: 1500 });
      })
      .finally(() => setFeeLoading(false));
  }, [step, shipping.city, shipping.state, cart.size]);

  // Poll order after Paystack payment
  useEffect(() => {
    if (step !== 3 || !order || !tokenRef.current) return;
    pollingRef.current = setInterval(async () => {
      try {
        const d = await call('GET', `/orders/${order.id}`, tokenRef.current);
        const o: Order = d.data;
        setPollCount((c) => c + 1);
        // Wait for both paymentStatus=paid AND deliveryId to be set
        if (o.paymentStatus === 'PAID' && o.deliveryId) {
          clearInterval(pollingRef.current!);
          setOrder(o);
          setJobId(o.deliveryId);
          setTrackingLink(o.deliveryRaw?.trackingLink ?? '');
          go(4);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(pollingRef.current!);
  }, [step, order?.id]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await call('POST', '/auth/login', undefined, { email, password });
      const tok = d.token ?? d.data?.token;
      const usr = d.user ?? d.data?.user;
      if (!tok) throw new Error('No token in response');
      tokenRef.current = tok;
      setToken(tok);
      setCustomerName(`${usr?.firstName ?? ''} ${usr?.lastName ?? ''}`.trim() || email);
      go(1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (cart.size === 0) return;
    setLoading(true);
    setError('');
    try {
      const items = [...cart.values()].map(({ product, qty }) => ({
        productId: product.id,
        quantity: qty,
      }));
      const d = await call('POST', '/orders', tokenRef.current, {
        items,
        shippingAddress: shipping,
        shippingCost: deliveryFee?.cost ?? 1500,
      });
      setOrder(d.data);
      go(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleInitPay = async () => {
    if (!order) return;
    setLoading(true);
    setError('');
    try {
      const d = await call('POST', '/payments/initialize', tokenRef.current, {
        orderId: order.id,
      });
      const url = d.data?.authorization_url;
      const ref = d.data?.reference;
      setPayUrl(url);
      setPayRef(ref);
      window.open(url, '_blank');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyManual = async () => {
    if (!payRef) return;
    setLoading(true);
    setError('');
    try {
      await call('GET', `/payments/verify/${payRef}`, tokenRef.current);

      // Poll up to 5×2s for Kwik to write deliveryId after markOrderPaid
      let o: Order | null = null;
      for (let i = 0; i < 5; i++) {
        const d = await call('GET', `/orders/${order!.id}`, tokenRef.current);
        o = d.data as Order;
        if (o.paymentStatus === 'PAID' && o.deliveryId) break;
        if (i < 4) await new Promise((r) => setTimeout(r, 2000));
      }

      if (!o || o.paymentStatus !== 'PAID') {
        setError('Payment not yet confirmed — try again in a moment.');
        return;
      }

      clearInterval(pollingRef.current!);
      setOrder(o);
      if (o.deliveryId) {
        setJobId(o.deliveryId);
        setTrackingLink(o.deliveryRaw?.trackingLink ?? '');
      }
      go(4);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!jobId) return;
    setLoading(true);
    setError('');
    try {
      // Use admin token for delivery status check (requires auth)
      const adminTok = localStorage.getItem('admin_token') || tokenRef.current;
      const d = await call('GET', `/deliveries/status/${jobId}`, adminTok);
      setDeliveryStatus(d.data?.orderStatus ?? 'Unknown');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <Button variant="outline" size="sm" onClick={reset}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset
        </Button>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          const Icon = s.icon;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300',
                    done
                      ? 'bg-green-500 text-white'
                      : active
                        ? 'bg-ebunly-orange text-white shadow-lg shadow-ebunly-orange/30'
                        : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-semibold',
                    active ? 'text-ebunly-orange' : done ? 'text-green-600' : 'text-gray-400'
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mb-4 transition-all duration-500',
                    i < step ? 'bg-green-400' : 'bg-gray-200'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Sliding step content */}
      <div className="overflow-hidden relative min-h-[480px]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="w-full"
          >
            {/* ── Step 0: Login ───────────────────────────────────────────── */}
            {step === 0 && (
              <StepShell
                title="Sign in as a test customer"
                description="We log in as a customer because orders and payments are customer actions."
              >
                <div className="space-y-4">
                  <Field label="Email">
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </Field>
                  <Field label="Password">
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                  <p className="text-xs text-gray-400">
                    Pre-filled with the test account. Change it if you want to test with a different
                    customer.
                  </p>
                  {error && <ErrorBox message={error} />}
                  <Button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-ebunly-orange hover:bg-ebunly-orange-dark text-white h-11"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Sign In <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </StepShell>
            )}

            {/* ── Step 1: Select products (multi) ───────────────────────── */}
            {step === 1 &&
              (() => {
                const cartTotal = [...cart.values()].reduce(
                  (s, e) => s + e.product.basePrice * e.qty,
                  0
                );
                const vendorIds = [...new Set([...cart.values()].map((e) => vendorId(e.product)))];
                const toggleProduct = (p: Product) => {
                  setCart((prev) => {
                    const next = new Map(prev);
                    if (next.has(p.id)) {
                      next.delete(p.id);
                    } else {
                      next.set(p.id, { product: p, qty: 1 });
                    }
                    return next;
                  });
                };
                const setCartQty = (id: string, delta: number) => {
                  setCart((prev) => {
                    const next = new Map(prev);
                    const entry = next.get(id);
                    if (!entry) return prev;
                    const newQty = entry.qty + delta;
                    if (newQty < 1) {
                      next.delete(id);
                    } else {
                      next.set(id, { ...entry, qty: newQty });
                    }
                    return next;
                  });
                };
                return (
                  <StepShell
                    title={`Hi ${customerName} 👋 build your order`}
                    description="Select products from one or more vendors. Kwik will collect from each vendor in a single rider trip."
                  >
                    {products.length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading products…
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                        {products.map((p) => {
                          const img = p.images?.[0]?.url;
                          const entry = cart.get(p.id);
                          const inCart = !!entry;
                          const vName = vendorNames[vendorId(p)] ?? 'Vendor';
                          return (
                            <div
                              key={p.id}
                              className={cn(
                                'border rounded-xl p-3 transition-all',
                                inCart
                                  ? 'border-ebunly-orange bg-orange-50 shadow-md shadow-ebunly-orange/10'
                                  : 'border-gray-200 bg-white'
                              )}
                            >
                              <button className="w-full text-left" onClick={() => toggleProduct(p)}>
                                {img && (
                                  <img
                                    src={img}
                                    alt={p.name}
                                    className="w-full h-20 object-cover rounded-lg mb-2 bg-gray-100"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                                <p className="text-[10px] font-bold text-ebunly-orange/80 uppercase tracking-wide mb-0.5">
                                  {vName}
                                </p>
                                <p className="text-xs font-semibold text-gray-800 line-clamp-2">
                                  {p.name}
                                </p>
                                <p className="text-sm font-bold text-ebunly-orange mt-1">
                                  ₦{p.basePrice.toLocaleString()}
                                </p>
                              </button>
                              {inCart && (
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-ebunly-orange/20">
                                  <button
                                    onClick={() => setCartQty(p.id, -1)}
                                    className="w-6 h-6 rounded-full border border-ebunly-orange/30 flex items-center justify-center hover:bg-orange-100"
                                  >
                                    <Minus className="w-3 h-3 text-ebunly-orange" />
                                  </button>
                                  <span className="flex-1 text-center text-sm font-bold text-ebunly-orange">
                                    {entry.qty}
                                  </span>
                                  <button
                                    onClick={() => setCartQty(p.id, 1)}
                                    className="w-6 h-6 rounded-full border border-ebunly-orange/30 flex items-center justify-center hover:bg-orange-100"
                                  >
                                    <Plus className="w-3 h-3 text-ebunly-orange" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Cart summary */}
                    {cart.size > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-xl space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            {cart.size} item{cart.size > 1 ? 's' : ''}
                          </span>
                          <span className="font-bold text-gray-900">
                            ₦{cartTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {vendorIds.map((vid, i) => (
                            <span
                              key={vid}
                              className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full"
                            >
                              {vendorNames[vid] ?? `Vendor ${String.fromCharCode(65 + i)}`}
                            </span>
                          ))}
                          {vendorIds.length > 1 && (
                            <span className="text-[10px] text-gray-400 ml-1">
                              → {vendorIds.length} Kwik pickups, 1 rider
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" onClick={() => go(0)} className="flex-1">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                      </Button>
                      <Button
                        onClick={() => go(2)}
                        disabled={cart.size === 0}
                        className="flex-1 bg-ebunly-orange hover:bg-ebunly-orange-dark text-white"
                      >
                        Continue ({cart.size}) <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </StepShell>
                );
              })()}

            {/* ── Step 2: Shipping ───────────────────────────────────────── */}
            {step === 2 && (
              <StepShell
                title="Delivery address"
                description="Pre-filled with a Lagos address. Edit if you want to test a different location."
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Field label="Full Name">
                        <Input
                          value={shipping.fullName}
                          onChange={(e) => setShipping((s) => ({ ...s, fullName: e.target.value }))}
                        />
                      </Field>
                    </div>
                    <div className="col-span-2">
                      <Field label="Street Address">
                        <StreetAutocomplete
                          value={shipping.street}
                          onChange={(street) => setShipping((s) => ({ ...s, street }))}
                        />
                      </Field>
                    </div>
                    <Field label="City">
                      <CityAutocomplete
                        value={shipping.city}
                        onChange={(city) => setShipping((s) => ({ ...s, city, state: 'Lagos' }))}
                      />
                    </Field>
                    <Field label="Phone">
                      <Input
                        value={shipping.phone}
                        onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))}
                      />
                    </Field>
                  </div>

                  {/* Order summary */}
                  {(() => {
                    const entries = [...cart.values()];
                    const itemsTotal = entries.reduce((s, e) => s + e.product.basePrice * e.qty, 0);
                    return (
                      <div className="py-3 border-t border-gray-100 mt-2 space-y-1.5">
                        {entries.map(({ product, qty }) => (
                          <div
                            key={product.id}
                            className="flex justify-between text-xs text-gray-600"
                          >
                            <span className="truncate max-w-[60%]">
                              {product.name} × {qty}
                            </span>
                            <span className="font-medium">
                              ₦{(product.basePrice * qty).toLocaleString()}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                          <span className="flex items-center gap-1">
                            Delivery (Kwik)
                            {deliveryFee?.breakdown && (
                              <span className="text-[10px] text-gray-400">
                                {deliveryFee.breakdown.distanceKm}km ~
                                {deliveryFee.breakdown.estimatedMinutes}min · ₦
                                {deliveryFee.breakdown.baseFare}+₦
                                {deliveryFee.breakdown.distanceFee}+₦{deliveryFee.breakdown.timeFee}
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            {feeLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              `₦${(deliveryFee?.cost ?? 1500).toLocaleString()}`
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-gray-900">
                          <span>Total</span>
                          <span>
                            ₦{(itemsTotal + (deliveryFee?.cost ?? 1500)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {error && <ErrorBox message={error} />}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => go(1)} className="flex-1">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button
                      onClick={handleCreateOrder}
                      disabled={loading || cart.size === 0}
                      className="flex-1 bg-ebunly-orange hover:bg-ebunly-orange-dark text-white"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Place Order ({cart.size} item{cart.size !== 1 ? 's' : ''}){' '}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </StepShell>
            )}

            {/* ── Step 3: Payment ────────────────────────────────────────── */}
            {step === 3 && (
              <StepShell
                title="Pay with Paystack"
                description="This is a real Paystack transaction on the test environment. Use the test card below."
              >
                <div className="space-y-4">
                  {/* Order ref */}
                  {order && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                      <span className="text-gray-500">Order</span>
                      <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
                      <span className="font-bold text-gray-900">
                        ₦{order.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Polling status */}
                  {payUrl && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Waiting for payment confirmation… ({pollCount} checks)</span>
                    </div>
                  )}

                  {error && <ErrorBox message={error} />}

                  <div className="space-y-2">
                    {!payUrl ? (
                      <Button
                        onClick={handleInitPay}
                        disabled={loading}
                        className="w-full bg-ebunly-orange hover:bg-ebunly-orange-dark text-white h-11"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CreditCard className="w-4 h-4 mr-2" />
                        )}
                        Open Paystack Checkout
                        <ExternalLink className="w-3.5 h-3.5 ml-2 opacity-60" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => window.open(payUrl, '_blank')}
                          variant="outline"
                          className="w-full"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" /> Re-open Paystack
                        </Button>
                        <Button
                          onClick={handleVerifyManual}
                          disabled={loading}
                          className="w-full bg-ebunly-orange hover:bg-ebunly-orange-dark text-white"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          I've paid — verify now
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </StepShell>
            )}

            {/* ── Step 4: Tracking ──────────────────────────────────────── */}
            {step === 4 && (
              <StepShell
                title="Order dispatched 🎉"
                description="Payment confirmed. Kwik auto-dispatched the delivery the moment Paystack fired the webhook."
              >
                <div className="space-y-4">
                  {/* Confirmed badge */}
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
                    <div>
                      <p className="font-bold text-green-800">Payment & dispatch confirmed</p>
                      <p className="text-sm text-green-600 mt-0.5">
                        Kwik job ID:{' '}
                        <code className="bg-green-100 px-1.5 py-0.5 rounded font-mono">
                          {jobId || '—'}
                        </code>
                      </p>
                    </div>
                  </div>

                  {/* Tracking link */}
                  {trackingLink && (
                    <a
                      href={trackingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border border-ebunly-orange/30 bg-orange-50 rounded-xl text-sm font-semibold text-ebunly-orange hover:bg-orange-100 transition-colors"
                    >
                      <Truck className="w-4 h-4 shrink-0" />
                      Open live Kwik tracking page
                      <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                    </a>
                  )}

                  {error && <ErrorBox message={error} />}

                  <Button onClick={reset} variant="outline" className="w-full">
                    Run another test
                  </Button>
                </div>
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 mb-5">{description}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-600">{label}</Label>
      {children}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
      <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
