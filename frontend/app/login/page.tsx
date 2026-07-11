"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Mail, Lock, ArrowRight, ArrowLeft, User, Phone, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useAuth } from "@/contexts/auth-context"
import { apiService } from "@/lib/api"

type LoginStep = 'EMAIL' | 'CHOOSE_METHOD' | 'PASSWORD' | 'OTP' | 'NO_ACCOUNT'
type SignupStep = 'EMAIL' | 'OTP' | 'PROFILE'

const getRedirectUrl = (userType: string) => {
  switch (userType) {
    case 'superadmin':
      return '/platform'
    case 'gym':
      return '/gym'
    case 'customer':
    default:
      return '/customer'
  }
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, loginWithOtp, registerWithOtp, isAuthenticated, user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("login")

  // Login state
  const [loginStep, setLoginStep] = useState<LoginStep>('EMAIL')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginOtp, setLoginOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)

  // Signup state
  const [signupStep, setSignupStep] = useState<SignupStep>('EMAIL')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupOtp, setSignupOtp] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  // OTP resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'signup') {
      setActiveTab('signup')
    }
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setSignupEmail(emailParam)
      setLoginEmail(emailParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectUrl = getRedirectUrl(user.userType)
      router.push(redirectUrl)
    }
  }, [isAuthenticated, user, router])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const resetErrors = () => {
    setError(null)
    setSuccess(null)
  }

  const handleRedirectAfterAuth = useCallback(() => {
    const userData = localStorage.getItem('neyofit_user_data')
    if (userData) {
      const u = JSON.parse(userData)
      const redirectUrl = getRedirectUrl(u.userType)
      window.location.href = redirectUrl
    } else {
      window.location.href = '/customer'
    }
  }, [])

  // ========== LOGIN FLOW ==========

  // Send OTP from email step (primary action)
  const handleLoginSendOtpFromEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleLoginSendOtp()
  }

  // Go to password step from email step
  const handleLoginUsePassword = async () => {
    if (!loginEmail) return
    setIsLoading(true)
    resetErrors()

    try {
      const result = await apiService.checkEmail(loginEmail)
      if (!result.exists) {
        setLoginStep('NO_ACCOUNT')
      } else if (!result.hasPassword) {
        setError('This account doesn\'t have a password. Please use OTP to sign in.')
      } else {
        setHasPassword(true)
        setLoginStep('PASSWORD')
      }
    } catch {
      setError('Failed to check email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginSendOtp = async () => {
    setIsLoading(true)
    resetErrors()

    try {
      const result = await apiService.sendOtp(loginEmail, 'login')
      if (result.success) {
        setLoginStep('OTP')
        setLoginOtp('')
        setResendCooldown(60)
      } else {
        setError(result.message || 'Failed to send OTP')
      }
    } catch {
      setError('Failed to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    resetErrors()

    try {
      const result = await login(loginEmail, loginPassword)
      if (result.success) {
        setSuccess('Login successful! Redirecting...')
        setTimeout(handleRedirectAfterAuth, 500)
      } else {
        setError(result.error || 'Invalid credentials')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loginOtp.length !== 6) return

    setIsLoading(true)
    resetErrors()

    try {
      const result = await loginWithOtp(loginEmail, loginOtp)
      if (result.success) {
        setSuccess('Login successful! Redirecting...')
        setTimeout(handleRedirectAfterAuth, 500)
      } else {
        setError(result.error || 'Invalid OTP')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // ========== SIGNUP FLOW ==========

  const handleSignupEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    resetErrors()

    try {
      const result = await apiService.sendOtp(signupEmail, 'signup')
      if (result.success) {
        setSignupStep('OTP')
        setSignupOtp('')
        setResendCooldown(60)
        // Pre-fill name from email prefix
        if (!signupName) {
          const prefix = signupEmail.split('@')[0]
          setSignupName(prefix.charAt(0).toUpperCase() + prefix.slice(1))
        }
      } else {
        setError(result.message || 'Failed to send OTP')
      }
    } catch {
      setError('Failed to send verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignupOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signupOtp.length !== 6) return

    // Move to profile step - actual verification happens on profile submit
    resetErrors()
    setSignupStep('PROFILE')
  }

  const handleSignupProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    resetErrors()

    if (!signupName.trim()) {
      setError('Name is required')
      setIsLoading(false)
      return
    }

    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions')
      setIsLoading(false)
      return
    }

    if (showPasswordFields && signupPassword) {
      if (signupPassword.length < 6) {
        setError('Password must be at least 6 characters')
        setIsLoading(false)
        return
      }
      if (signupPassword !== signupConfirmPassword) {
        setError('Passwords do not match')
        setIsLoading(false)
        return
      }
    }

    try {
      const result = await registerWithOtp({
        email: signupEmail,
        otp: signupOtp,
        name: signupName.trim(),
        phone: signupPhone.trim() || undefined,
        password: showPasswordFields && signupPassword ? signupPassword : undefined,
      })

      if (result.success) {
        setSuccess('Account created successfully! Redirecting...')
        setTimeout(handleRedirectAfterAuth, 1000)
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async (purpose: 'login' | 'signup') => {
    if (resendCooldown > 0) return
    setIsLoading(true)
    resetErrors()

    const email = purpose === 'login' ? loginEmail : signupEmail

    try {
      const result = await apiService.sendOtp(email, purpose)
      if (result.success) {
        setResendCooldown(60)
        setSuccess('New code sent to your email')
        if (purpose === 'login') setLoginOtp('')
        else setSignupOtp('')
      } else {
        setError(result.message || 'Failed to resend code')
      }
    } catch {
      setError('Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }

  const switchToSignupWithEmail = () => {
    setSignupEmail(loginEmail)
    setActiveTab('signup')
    setLoginStep('EMAIL')
    resetErrors()
  }

  const handleTabChange = (v: string) => {
    setActiveTab(v)
    setLoginStep('EMAIL')
    setSignupStep('EMAIL')
    resetErrors()
  }

  // ========== RENDER ==========

  const renderLoginContent = () => {
    switch (loginStep) {
      case 'EMAIL':
        return (
          <form onSubmit={handleLoginSendOtpFromEmail} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-white/80">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="pl-10 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-orange-400/30"
                  required
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 shadow-lg shadow-orange-500/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Send OTP
                </>
              )}
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-transparent px-3 text-xs text-white/40">or</span>
            </div>

            <button
              type="button"
              onClick={handleLoginUsePassword}
              disabled={isLoading || !loginEmail}
              className="w-full text-sm text-white/60 hover:text-white/80 transition-colors flex items-center justify-center gap-2 py-2 border border-white/10 rounded-md hover:border-white/20 disabled:opacity-40"
            >
              <Lock className="h-3.5 w-3.5" />
              Sign in with password instead
            </button>
          </form>
        )

      case 'PASSWORD':
        return (
          <form onSubmit={handleLoginPasswordSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
              <Mail className="h-3.5 w-3.5" />
              <span>{loginEmail}</span>
              <button
                type="button"
                onClick={() => { setLoginStep('EMAIL'); resetErrors() }}
                className="text-orange-400 hover:text-orange-300 ml-auto text-xs"
              >
                Change
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-sm font-medium text-white/80">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-orange-400/30"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-white/40 hover:text-white/70"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={handleLoginSendOtp}
                className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                disabled={isLoading}
              >
                Sign in with OTP instead
              </button>
              <Link href="/forgot-password" className="text-sm text-white/50 hover:text-white/70 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 shadow-lg shadow-orange-500/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )

      case 'OTP':
        return (
          <form onSubmit={handleLoginOtpSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-white/60 mb-1">
              <Mail className="h-3.5 w-3.5" />
              <span>{loginEmail}</span>
              <button
                type="button"
                onClick={() => { setLoginStep('EMAIL'); resetErrors() }}
                className="text-orange-400 hover:text-orange-300 ml-auto text-xs"
              >
                Change
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-green-400/80 mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Code sent to {loginEmail}</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80">
                Enter verification code
              </label>
              <div className="flex justify-center py-2">
                <InputOTP
                  maxLength={6}
                  value={loginOtp}
                  onChange={setLoginOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="bg-white/10 border-white/20 text-white" />
                    <InputOTPSlot index={1} className="bg-white/10 border-white/20 text-white" />
                    <InputOTPSlot index={2} className="bg-white/10 border-white/20 text-white" />
                    <InputOTPSlot index={3} className="bg-white/10 border-white/20 text-white" />
                    <InputOTPSlot index={4} className="bg-white/10 border-white/20 text-white" />
                    <InputOTPSlot index={5} className="bg-white/10 border-white/20 text-white" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => handleResendOtp('login')}
                disabled={resendCooldown > 0 || isLoading}
                className="text-sm text-orange-400 hover:text-orange-300 disabled:text-white/30 transition-colors"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 shadow-lg shadow-orange-500/20"
              disabled={isLoading || loginOtp.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {hasPassword && (
              <button
                type="button"
                onClick={() => { setLoginStep('PASSWORD'); resetErrors() }}
                className="w-full text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                Use password instead
              </button>
            )}
          </form>
        )

      case 'NO_ACCOUNT':
        return (
          <div className="space-y-4 text-center">
            <div className="py-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-white/40" />
              </div>
              <p className="text-white/80 text-sm mb-1">No account found for</p>
              <p className="text-white font-medium">{loginEmail}</p>
            </div>

            <Button
              onClick={switchToSignupWithEmail}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 shadow-lg shadow-orange-500/20"
            >
              Create Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <button
              type="button"
              onClick={() => { setLoginStep('EMAIL'); resetErrors() }}
              className="w-full text-sm text-white/50 hover:text-white/70 transition-colors"
            >
              Try a different email
            </button>
          </div>
        )
    }
  }

  const renderSignupContent = () => {
    switch (signupStep) {
      case 'EMAIL':
        return (
          <form onSubmit={handleSignupEmailSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="signup-email" className="text-sm font-medium text-white/80">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="pl-10 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-orange-400/30"
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-white/40">We'll send a verification code to this email</p>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 shadow-lg shadow-orange-500/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Send OTP
                </>
              )}
            </Button>
          </form>
        )

      case 'OTP':
        return (
          <form onSubmit={handleSignupOtpVerify} className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-white/60 mb-1">
              <Mail className="h-3.5 w-3.5" />
              <span>{signupEmail}</span>
              <button
                type="button"
                onClick={() => { setSignupStep('EMAIL'); resetErrors() }}
                className="text-orange-400 hover:text-orange-300 ml-auto text-xs"
              >
                Change
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-green-400/80 mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verification code sent</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80">
                Enter verification code
              </label>
              <div className="flex justify-center py-2">
                <InputOTP
                  maxLength={6}
                  value={signupOtp}
                  onChange={setSignupOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="bg-white/10 border-white/20 text-white" />
                    <InputOTPSlot index={1} className="bg-white/10 border-white/20 text-white" />
                    <InputOTPSlot index={2} className="bg-white/10 border-white/20 text-white" />
                    <InputOTPSlot index={3} className="bg-white/10 border-white/20 text-white" />
                    <InputOTPSlot index={4} className="bg-white/10 border-white/20 text-white" />
                    <InputOTPSlot index={5} className="bg-white/10 border-white/20 text-white" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => handleResendOtp('signup')}
                disabled={resendCooldown > 0 || isLoading}
                className="text-sm text-orange-400 hover:text-orange-300 disabled:text-white/30 transition-colors"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 shadow-lg shadow-orange-500/20"
              disabled={isLoading || signupOtp.length !== 6}
            >
              Verify Email
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )

      case 'PROFILE':
        return (
          <form onSubmit={handleSignupProfileSubmit} className="space-y-3.5">
            <button
              type="button"
              onClick={() => { setSignupStep('OTP'); resetErrors() }}
              className="flex items-center gap-1 text-sm text-white/50 hover:text-white/70 transition-colors mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            <div className="space-y-1.5">
              <label htmlFor="signup-name" className="text-sm font-medium text-white/80">
                Full Name <span className="text-orange-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="pl-10 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-orange-400/30"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="signup-phone" className="text-sm font-medium text-white/80">
                Phone <span className="text-white/30">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                <Input
                  id="signup-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  className="pl-10 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-orange-400/30"
                />
              </div>
            </div>

            {/* Collapsible password section */}
            <div>
              <button
                type="button"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="text-sm text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
              >
                <Lock className="h-3.5 w-3.5" />
                {showPasswordFields ? 'Remove password' : 'Set a password (optional)'}
              </button>

              {showPasswordFields && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1.5">
                    <label htmlFor="signup-password" className="text-sm font-medium text-white/80">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Min 6 chars"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 pr-9 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-orange-400/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-3 text-white/40 hover:text-white/70"
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="signup-confirm-password" className="text-sm font-medium text-white/80">
                      Confirm
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                      <Input
                        id="signup-confirm-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Confirm"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="pl-10 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-orange-400/30"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(!!checked)}
                className="border-white/30 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
              />
              <label htmlFor="terms" className="text-sm text-white/60">
                I agree to the{" "}
                <Link href="/terms" className="text-orange-400 hover:text-orange-300">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-orange-400 hover:text-orange-300">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 shadow-lg shadow-orange-500/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Complete Registration
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-white/40 mt-2">
              Are you a gym owner? Contact us to get your account set up.
            </p>
          </form>
        )
    }
  }

  const getHeaderText = () => {
    if (activeTab === 'login') {
      switch (loginStep) {
        case 'EMAIL': return 'Welcome back'
        case 'CHOOSE_METHOD': return 'Choose sign in method'
        case 'PASSWORD': return 'Enter your password'
        case 'OTP': return 'Check your email'
        case 'NO_ACCOUNT': return 'Account not found'
      }
    } else {
      switch (signupStep) {
        case 'EMAIL': return 'Create your account'
        case 'OTP': return 'Verify your email'
        case 'PROFILE': return 'Complete your profile'
      }
    }
  }

  const getSubHeaderText = () => {
    if (activeTab === 'login') {
      switch (loginStep) {
        case 'EMAIL': return 'Sign in to access your gym passes'
        case 'CHOOSE_METHOD': return 'How would you like to sign in?'
        case 'PASSWORD': return 'Enter your password to continue'
        case 'OTP': return 'Enter the 6-digit code we sent you'
        case 'NO_ACCOUNT': return "We couldn't find an account with that email"
      }
    } else {
      switch (signupStep) {
        case 'EMAIL': return 'Join Neyofit and start your fitness journey'
        case 'OTP': return 'Enter the code sent to your email'
        case 'PROFILE': return 'Tell us a bit about yourself'
      }
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Full-page background */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-background.jpeg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-blue-900/60 to-black/80" />
      </div>

      {/* Floating subtle shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
      >
        <ArrowRight className="h-4 w-4 rotate-180" />
        Back to Home
      </Link>

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-md mx-4 sm:mx-auto">
        <div className="backdrop-blur-xl bg-white/[0.08] border border-white/[0.15] rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Logo + Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-block mb-4">
              <img
                src="/images/neyofit.png"
                alt="Neyofit"
                className="h-11 rounded-lg mx-auto"
              />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {getHeaderText()}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {getSubHeaderText()}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/10 mb-5">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-white/70 data-[state=active]:shadow-sm"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-white/70 data-[state=active]:shadow-sm"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              {renderLoginContent()}
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              {renderSignupContent()}
            </TabsContent>
          </Tabs>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive" className="mt-4 bg-red-500/20 border-red-400/30 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4 bg-green-500/20 border-green-400/30 text-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer text below card */}
        <p className="text-center text-white/30 text-xs mt-6">
          &copy; {new Date().getFullYear()} Neyofit. All rights reserved.
        </p>
      </div>
    </div>
  )
}
