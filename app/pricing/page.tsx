'use client';
import { useState, useEffect } from 'react';
import { Check, ShieldCheck, Terminal, Award, HelpCircle, Phone, ArrowRight, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { paymentService } from '@/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function PricingPage() {
  const { user, isAuthenticated, fetchUser } = useAuthStore();
  const [priceData, setPriceData] = useState<{ price: number; currency: string } | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  // Form State
  const [phone, setPhone] = useState('');
  const [gateway, setGateway] = useState<'CM_ORANGE' | 'CM_MTN'>('CM_ORANGE');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    paymentService.getSubscriptionPrice()
      .then(res => setPriceData(res.data))
      .catch(() => toast.error('Failed to load subscription price.'))
      .finally(() => setLoadingPrice(false));
  }, []);

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
      const res = await paymentService.initiateSubscription(phone, gateway);
      toast.success(res.data.detail || 'Payment initiated! Check your phone for verification prompting.');
      setPaymentSuccess(true);
      
      // Periodically refresh user profile to detect subscription success
      const interval = setInterval(async () => {
        await fetchUser();
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.is_subscribed) {
          clearInterval(interval);
          toast.success('Your subscription is now active! Enjoy unlimited lab access.');
          setPaymentSuccess(false);
          setIsPaying(false);
        }
      }, 5000);

      // Timeout after 3 minutes
      setTimeout(() => {
        clearInterval(interval);
        setIsPaying(false);
      }, 180000);

    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Subscription initiation failed.');
      setIsPaying(false);
    }
  };

  const benefits = [
    { icon: Terminal, title: 'Unlimited Lab Execution', desc: 'Run C code compile sessions and execute SQL queries without limits.' },
    { icon: Star, title: 'Access Premium Courses', desc: 'Unlock advanced MySQL database design and software architecture modules.' },
    { icon: Award, title: 'Verified Certification', desc: 'Earn downloadable PDF certificates of completion signed by instructors.' },
    { icon: ShieldCheck, title: 'Priority Workspace Support', desc: 'Access isolated sandbox containers with maximum speed and uptime.' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 pb-24 md:pb-12 animate-in fade-in duration-700">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Invest in your developer career
        </h1>
        <p className="text-gray-400 mt-3 max-w-xl mx-auto text-sm">
          Get complete access to advanced sandboxed containers, execution editors, and certification programs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Benefits List */}
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
        </div>

        {/* Pricing & Checkout Card */}
        <div className="lg:col-span-5">
          <div className="card p-6 border-neb-900/30 bg-dark-900/40 backdrop-blur-sm shadow-2xl relative overflow-hidden">
            {/* Ribbon */}
            <div className="absolute top-0 right-0 bg-neb-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-lg tracking-wider">
              Yearly Access
            </div>

            <div className="mb-6">
              <span className="text-xs font-bold text-neb-400 uppercase tracking-widest">Premium Plan</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-4xl font-extrabold text-white">
                  {loadingPrice ? '...' : Number(priceData?.price || 25000).toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 font-semibold">
                  {priceData?.currency || 'XAF'} / year
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Renews annually. Cancel anytime.</p>
            </div>

            {user?.is_subscribed ? (
              <div className="p-4 rounded-xl bg-green-950/20 border border-green-900/30 text-center flex flex-col items-center gap-2">
                <ShieldCheck className="h-10 w-10 text-green-400" />
                <h4 className="font-bold text-white text-sm">Your Subscription is Active</h4>
                <p className="text-xs text-gray-500">Thank you for supporting Nebcode! You have unlimited premium access.</p>
              </div>
            ) : paymentSuccess ? (
              <div className="p-4 rounded-xl bg-neb-950/20 border border-neb-900/30 text-center flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neb-400"></div>
                <h4 className="font-bold text-white text-sm">Awaiting Confirmation</h4>
                <p className="text-xs text-gray-400">
                  Please validate the USSD pop-up prompt sent to your Mobile Money number. Once validated, this page will activate automatically.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
                <div className="border-t border-dark-800 my-2"></div>

                {/* Gateway selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-400 font-semibold">Payment Gateway</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGateway('CM_ORANGE')}
                      className={`py-2.5 rounded-lg border text-xs font-bold transition ${
                        gateway === 'CM_ORANGE'
                          ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                          : 'bg-dark-950 border-dark-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      Orange Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setGateway('CM_MTN')}
                      className={`py-2.5 rounded-lg border text-xs font-bold transition ${
                        gateway === 'CM_MTN'
                          ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400'
                          : 'bg-dark-950 border-dark-800 text-gray-400 hover:text-white'
                      }`}
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
                  Pay with Mobile Money
                </Button>

                <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                  Payments are secure, automated and processed instantly via the Payunit transaction network.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
