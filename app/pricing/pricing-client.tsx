'use client';
import { useState, useEffect } from 'react';
import { Check, ShieldCheck, Terminal, Award, HelpCircle, Phone, Star, Sparkles, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { paymentService } from '@/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type PlanType = 'monthly' | 'yearly';

export default function PricingPageClient() {
  const { user, isAuthenticated, fetchUser } = useAuthStore();
  const [priceData, setPriceData] = useState<{ monthly: { price: number }; yearly: { price: number } } | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [planType, setPlanType] = useState<PlanType>('yearly');

  // Payment form state
  const [phone, setPhone] = useState('');
  const [gateway, setGateway] = useState<'CM_ORANGE' | 'CM_MTN'>('CM_MTN');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Redeem code state
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showRedeemForm, setShowRedeemForm] = useState(false);

  useEffect(() => {
    paymentService.getSubscriptionPrice()
      .then(res => setPriceData(res.data))
      .catch(() => toast.error('Failed to load subscription price.'))
      .finally(() => setLoadingPrice(false));
  }, []);

  const currentPrice = planType === 'monthly'
    ? (priceData?.monthly?.price ?? 1000)
    : (priceData?.yearly?.price ?? 5000);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to subscribe.');
      return;
    }
    if (!phone) {
      toast.error('Please enter your Mobile Money phone number.');
      return;
    }

    setIsPaying(true);
    try {
      const res = await paymentService.initiateSubscription(phone, gateway, planType);
      toast.success(res.data.detail || 'Payment initiated! Check your phone.');
      setPaymentSuccess(true);

      // Poll for subscription activation
      const interval = setInterval(async () => {
        await fetchUser();
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.is_subscribed) {
          clearInterval(interval);
          toast.success('Your subscription is now active! Enjoy full platform access.');
          setPaymentSuccess(false);
          setIsPaying(false);
        }
      }, 5000);
      setTimeout(() => { clearInterval(interval); setIsPaying(false); }, 180000);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Subscription initiation failed.');
      setIsPaying(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please sign in to redeem a code.'); return; }
    if (!redeemCode.trim()) { toast.error('Enter your access code.'); return; }
    setIsRedeeming(true);
    try {
      const res = await paymentService.redeemAccessCode(redeemCode.trim().toUpperCase());
      toast.success(res.data.detail || 'Code redeemed! You now have premium access.');
      await fetchUser();
      setRedeemCode('');
      setShowRedeemForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid or already used code.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const benefits = [
    { icon: Terminal, title: 'Unlimited C Code Editor', desc: 'Full sandboxed C execution with compilation, I/O and real-time output in your browser.' },
    { icon: Star, title: 'All Courses Unlocked', desc: 'Access every course — C programming, MySQL, and more — with no restrictions.' },
    { icon: Award, title: 'MySQL Lab Access', desc: 'Run live SQL queries against a dedicated MySQL server with persistent sessions.' },
    { icon: ShieldCheck, title: 'Verified Certification', desc: 'Earn PDF certificates of completion signed by Nebcode instructors.' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 pb-24 md:pb-12 animate-in fade-in duration-700">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          One subscription. Full access.
        </h1>
        <p className="text-gray-400 mt-3 max-w-xl mx-auto text-sm">
          Subscribe once and unlock the C editor, MySQL lab, and all courses. No per-course fees.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Benefits */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-white mb-2">What you get with Nebcode Premium</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div key={idx} className="card p-5 border-dark-800 bg-dark-900/20 backdrop-blur-sm flex flex-col gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neb-900/40 border border-neb-800/30 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-neb-400" />
                  </div>
                  <h3 className="font-bold text-sm text-white">{b.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Redeem access code section */}
          <div className="card p-5 border-neb-900/30 bg-dark-900/20 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-neb-400" />
              <h3 className="font-bold text-sm text-white">Have an access code?</h3>
            </div>
            <p className="text-xs text-gray-500">
              Received a 6-character premium access code? Redeem it for 1 year of free premium access.
            </p>
            {!showRedeemForm ? (
              <button
                onClick={() => setShowRedeemForm(true)}
                className="self-start text-xs text-neb-400 hover:text-neb-300 font-semibold underline underline-offset-2 transition"
              >
                Redeem a code →
              </button>
            ) : (
              <form onSubmit={handleRedeem} className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A3B7K9"
                  maxLength={6}
                  className="flex-1 px-3 py-2 text-sm font-mono uppercase bg-dark-950 border border-dark-800 rounded-lg outline-none text-white focus:border-neb-500 transition tracking-widest"
                />
                <Button type="submit" isLoading={isRedeeming} className="text-xs py-2 px-4 bg-neb-700 hover:bg-neb-600">
                  Redeem
                </Button>
                <button type="button" onClick={() => setShowRedeemForm(false)} className="text-xs text-gray-500 hover:text-white transition">Cancel</button>
              </form>
            )}
          </div>
        </div>

        {/* Pricing card */}
        <div className="lg:col-span-5">
          <div className="card p-6 border-neb-900/30 bg-dark-900/40 backdrop-blur-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-neb-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-lg tracking-wider">
              {planType === 'monthly' ? 'Monthly' : 'Yearly'} Access
            </div>

            {/* Plan toggle */}
            <div className="mb-5 flex bg-dark-950 border border-dark-800 p-1 rounded-xl">
              <button
                onClick={() => setPlanType('monthly')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${planType === 'monthly' ? 'bg-neb-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPlanType('yearly')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${planType === 'yearly' ? 'bg-neb-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Yearly
                <span className="ml-1.5 text-[9px] bg-green-700/60 text-green-300 px-1.5 py-0.5 rounded-full">Best Value</span>
              </button>
            </div>

            <div className="mb-6">
              <span className="text-xs font-bold text-neb-400 uppercase tracking-widest">Premium Plan</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-4xl font-extrabold text-white">
                  {loadingPrice ? '...' : currentPrice.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 font-semibold">
                  XAF / {planType === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
            </div>

            {user?.is_subscribed ? (
              <div className="p-4 rounded-xl bg-green-950/20 border border-green-900/30 text-center flex flex-col items-center gap-2">
                <ShieldCheck className="h-10 w-10 text-green-400" />
                <h4 className="font-bold text-white text-sm">Your Subscription is Active</h4>
                <p className="text-xs text-gray-500">You have full access to all courses, the C editor, and MySQL lab.</p>
              </div>
            ) : paymentSuccess ? (
              <div className="p-4 rounded-xl bg-neb-950/20 border border-neb-900/30 text-center flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neb-400"></div>
                <h4 className="font-bold text-white text-sm">Awaiting Confirmation</h4>
                <p className="text-xs text-gray-400">
                  Validate the USSD pop-up on your phone. This page will update automatically.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
                <div className="border-t border-dark-800 my-2"></div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-400 font-semibold">Payment Gateway</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGateway('CM_ORANGE')}
                      className={`py-2.5 rounded-lg border text-xs font-bold transition ${gateway === 'CM_ORANGE'
                        ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                        : 'bg-dark-950 border-dark-800 text-gray-400 hover:text-white'}`}
                    >
                      Orange Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setGateway('CM_MTN')}
                      className={`py-2.5 rounded-lg border text-xs font-bold transition ${gateway === 'CM_MTN'
                        ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400'
                        : 'bg-dark-950 border-dark-800 text-gray-400 hover:text-white'}`}
                    >
                      MTN MoMo
                    </button>
                  </div>
                </div>

                <Input
                  label="Mobile Money Number"
                  placeholder="e.g. 6xxxxxxxx"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  isLoading={isPaying}
                  className="w-full py-4 text-xs font-bold mt-2 shadow-neb"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Pay {currentPrice.toLocaleString()} XAF — {planType === 'monthly' ? '1 Month' : '1 Year'} Access
                </Button>

                <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                  Payments processed instantly via the Payunit network. Secure & automated.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
