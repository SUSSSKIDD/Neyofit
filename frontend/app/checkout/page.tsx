"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  Calendar,
  User,
  Check,
  ArrowLeft,
  Shield,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import { apiService, Gym, SubscriptionListing } from "@/lib/api";
import AuthModal from "@/components/auth-modal";

// Declare Razorpay global
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gymId = searchParams.get("gym");
  const subscriptionId = searchParams.get("subscription");
  const { user } = useAuth();

  const [gym, setGym] = useState<Gym | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionListing | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    if (gymId && subscriptionId) {
      fetchData();
    } else {
      setError("Invalid checkout link. Please select a gym and plan.");
      setLoading(false);
    }

    return () => {
      // Cleanup script on unmount
      const scriptElement = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (scriptElement) {
        document.body.removeChild(scriptElement);
      }
    };
    // eslint-disable-next-line
  }, [gymId, subscriptionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch gym
      const gymRes = await apiService.getGymById(gymId!);
      if (gymRes && typeof gymRes === "object" && "_id" in gymRes) {
        setGym(gymRes as Gym);
      } else if (
        gymRes &&
        typeof gymRes === "object" &&
        "data" in gymRes &&
        gymRes.data &&
        "_id" in gymRes.data
      ) {
        setGym(gymRes.data as Gym);
      } else {
        setError("Gym not found");
        setLoading(false);
        return;
      }
      // Fetch subscription
      const subsRes = await apiService.getGymSubscriptionListings(gymId!);
      let subsArr: SubscriptionListing[] = [];
      if (Array.isArray(subsRes)) {
        subsArr = subsRes;
      } else if (
        subsRes &&
        typeof subsRes === "object" &&
        "data" in subsRes &&
        Array.isArray(subsRes.data)
      ) {
        subsArr = subsRes.data;
      }
      if (subsArr.length > 0) {
        const found = subsArr.find(
          (s: SubscriptionListing) => s._id === subscriptionId
        );
        if (found) {
          setSubscription(found);
        } else {
          setError("Subscription plan not found");
        }
      } else {
        setError("Failed to fetch subscription plans");
      }
    } catch (e) {
      setError("Failed to load checkout data");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!subscription || !razorpayLoaded) return;

    // Check if user is authenticated
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsPaying(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Create Razorpay order
      const orderRes = await apiService.createPaymentOrder(subscription._id);
      console.log("Payment order response:", orderRes);
      if (orderRes && orderRes.success === false) {
        // Map backend error to user-friendly message
        let errMsg = orderRes.message || "Failed to create payment order";
        if (orderRes.error) {
          // Friendly error mapping
          if (orderRes.error.includes("Subscription listing not found")) {
            errMsg =
              "The selected subscription plan does not exist. Please refresh and try again.";
          } else if (
            orderRes.error.includes("You already have an active subscription")
          ) {
            errMsg = "You already have an active subscription for this plan.";
          } else if (
            orderRes.error.includes("RAZORPAY_KEY_ID") ||
            orderRes.error.includes("RAZORPAY_KEY_SECRET")
          ) {
            errMsg = "Payment configuration error. Please contact support.";
          } else if (orderRes.error.includes("ECONNREFUSED")) {
            errMsg = "Payment gateway is unreachable. Please try again later.";
          } else {
            errMsg += `: ${orderRes.error}`;
          }
        }
        setError(errMsg);
        setIsPaying(false);
        return;
      }
      const flatRes = orderRes as any;
      if (!flatRes || !flatRes.orderId) {
        setError("Failed to create payment order (invalid response)");
        setIsPaying(false);
        return;
      }

      const { orderId, amount, currency } = flatRes;

      // Step 2: Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: gym?.name || "Neyofit",
        description: subscription.name,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            // Step 3: Verify payment
            const verifyRes = await apiService.verifyPayment({
              subscriptionListingId: subscription._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              setSuccess(
                "Payment successful! Gym pass activated. Redirecting to dashboard..."
              );
              setTimeout(() => router.push("/customer"), 2000);
            } else {
              setError(verifyRes.message || "Payment verification failed");
            }
          } catch (error) {
            setError("Payment verification failed");
          } finally {
            setIsPaying(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || "8896821314",
        },
        theme: {
          color: "#1e40af",
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      setError("Failed to initiate payment");
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading checkout...</span>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="flex items-center text-gray-600"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Gym
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-8">Checkout</h1>

        {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}
        {success && (
          <div className="mb-4 text-green-600 font-medium">{success}</div>
        )}
        {!user && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Sign in required:</strong> Please sign in or create an
                  account to complete your purchase.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Order Summary */}
          <div className="lg:w-1/3 order-2 lg:order-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start mb-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden mr-3">
                      <img
                        src={
                          gym?.pictures?.[0] ||
                          "/placeholder.svg?height=64&width=64"
                        }
                        alt="Gym thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold">{gym?.name}</h3>
                      <p className="text-sm text-gray-600">
                        {gym?.location?.address.city},{" "}
                        {gym?.location?.address.state}
                      </p>
                      <p className="text-sm font-medium text-blue-900 mt-1">
                        {subscription?.name}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div className="flex items-center mb-1">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      {subscription?.durationInDays} days unlimited access
                    </div>
                    {subscription?.features?.map((f, i) => (
                      <div key={i} className="flex items-center mb-1">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pass Price</span>
                    <span>₹{subscription?.cost}</span>
                  </div>
                  {/* GST, fees, discount can be calculated here if needed */}
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{subscription?.cost}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={handlePay}
                  disabled={isPaying || !subscription}
                >
                  {isPaying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isPaying
                    ? "Processing..."
                    : user
                    ? `Pay ₹${subscription?.cost}`
                    : "Sign In to Pay"}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  By completing this purchase, you agree to our{" "}
                  <a href="/terms" className="text-blue-900 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-blue-900 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </CardFooter>
            </Card>
          </div>

          {/* Payment Information */}
          <div className="lg:w-2/3 order-1 lg:order-2">
            <div className="space-y-6">
              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5 text-blue-900" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center mb-2">
                      <Shield className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-900">
                        Secure Payment by Razorpay
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Your payment is processed securely by Razorpay. We support
                      all major payment methods.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center space-x-2 bg-white rounded p-2">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span className="text-xs">Cards</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white rounded p-2">
                        <Shield className="h-4 w-4 text-gray-600" />
                        <span className="text-xs">UPI</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white rounded p-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="text-xs">Wallets</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white rounded p-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="text-xs">NetBanking</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-gray-600">
                    <p className="text-sm">
                      Click "Pay Now" to proceed with secure Razorpay checkout
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Security Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-green-600" />
                    Security & Trust
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm">256-bit SSL encryption</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm">PCI DSS compliant</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm">
                        Instant gym pass activation
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm">24/7 customer support</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          // User successfully authenticated, they can now proceed with payment
          setShowAuthModal(false);
        }}
        redirectTo={`/checkout?gym=${gymId}&subscription=${subscriptionId}`}
      />
    </div>
  );
}
