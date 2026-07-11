"use client"

import { useState } from "react"
import { Mail, Lock, ArrowRight, User, Phone, Loader2, Eye, EyeOff, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"

interface LoginFormData {
    email: string
    password: string
}

interface SignupFormData {
    name: string
    email: string
    phone: string
    password: string
    confirmPassword: string
    agreeToTerms: boolean
}

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
    redirectTo?: string
}

export default function AuthModal({ isOpen, onClose, onSuccess, redirectTo }: AuthModalProps) {
    const { login, register } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("login")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [loginForm, setLoginForm] = useState<LoginFormData>({
        email: '',
        password: ''
    })

    const [signupForm, setSignupForm] = useState<SignupFormData>({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
    })

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const result = await login(loginForm.email, loginForm.password)

            if (result.success) {
                setSuccess('Login successful! Redirecting...')
                setTimeout(() => {
                    onSuccess?.()
                    onClose()
                }, 1000)
            } else {
                setError(result.error || 'Login failed')
            }
        } catch (error) {
            setError('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(null)

        // Validation
        if (signupForm.password !== signupForm.confirmPassword) {
            setError('Passwords do not match')
            setIsLoading(false)
            return
        }

        if (!signupForm.agreeToTerms) {
            setError('Please agree to the terms and conditions')
            setIsLoading(false)
            return
        }

        try {
            const result = await register({
                name: signupForm.name,
                email: signupForm.email,
                phone: signupForm.phone,
                password: signupForm.password
            })

            if (result.success) {
                setSuccess('Registration successful! Redirecting...')
                setTimeout(() => {
                    onSuccess?.()
                    onClose()
                }, 1000)
            } else {
                setError(result.error || 'Registration failed')
            }
        } catch (error) {
            setError('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const resetForms = () => {
        setLoginForm({ email: '', password: '' })
        setSignupForm({
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            agreeToTerms: false
        })
        setError(null)
        setSuccess(null)
    }

    const handleClose = () => {
        resetForms()
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">Welcome to Neyofit</DialogTitle>
                    <DialogDescription className="text-center">
                        {redirectTo ? 'Please sign in to continue with your purchase' : 'Sign in to your account or create a new one'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        {/* Login Tab */}
                        <TabsContent value="login" className="space-y-4">
                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="modal-login-email" className="text-sm font-medium">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="modal-login-email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={loginForm.email}
                                            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="modal-login-password" className="text-sm font-medium">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="modal-login-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={loginForm.password}
                                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                            className="pl-10 pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff /> : <Eye />}
                                        </button>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={isLoading}>
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
                        </TabsContent>

                        {/* Signup Tab */}
                        <TabsContent value="signup" className="space-y-4">
                            <form onSubmit={handleSignupSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="modal-signup-name" className="text-sm font-medium">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="modal-signup-name"
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={signupForm.name}
                                            onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="modal-signup-email" className="text-sm font-medium">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="modal-signup-email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={signupForm.email}
                                            onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="modal-signup-phone" className="text-sm font-medium">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="modal-signup-phone"
                                            type="tel"
                                            placeholder="Enter your phone number"
                                            value={signupForm.phone}
                                            onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="modal-signup-password" className="text-sm font-medium">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="modal-signup-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a password"
                                            value={signupForm.password}
                                            onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                                            className="pl-10 pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff /> : <Eye />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="modal-signup-confirm-password" className="text-sm font-medium">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="modal-signup-confirm-password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm your password"
                                            value={signupForm.confirmPassword}
                                            onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                                            className="pl-10 pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff /> : <Eye />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="modal-terms"
                                        checked={signupForm.agreeToTerms}
                                        onCheckedChange={(checked) => setSignupForm({ ...signupForm, agreeToTerms: !!checked })}
                                    />
                                    <label htmlFor="modal-terms" className="text-sm text-gray-600">
                                        I agree to the{" "}
                                        <a href="/terms" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                            Terms of Service
                                        </a>{" "}
                                        and{" "}
                                        <a href="/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                            Privacy Policy
                                        </a>
                                    </label>
                                </div>

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            Create Account
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    {/* Error/Success Messages */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="border-green-200 bg-green-50 text-green-800">
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}





