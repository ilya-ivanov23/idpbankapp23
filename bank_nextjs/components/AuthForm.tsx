'use client';

import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Form,
} from "@/components/ui/form"
import CustomInput from './CustomInput';
import { authFormSchema } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getLoggedInUser, signIn, signUp, verifyOtp } from '@/lib/actions/user.actions';

const AuthForm = ({ type }: { type: string }) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']); // Array for 6 digits
    const [errorMessage, setErrorMessage] = useState("");

    const formSchema = authFormSchema(type);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: ''
        },
    })

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            if (type === 'sign-up') {
                const userData = {
                    firstName: data.firstName!,
                    lastName: data.lastName!,
                    address1: data.address1!,
                    city: data.city!,
                    state: data.state!,
                    postalCode: data.postalCode!,
                    dateOfBirth: data.dateOfBirth!,
                    ssn: data.ssn!,
                    email: data.email,
                    password: data.password
                }

                const newUser = await signUp(userData);
                if (newUser?.error) {
                    setErrorMessage(newUser.error);
                } else {
                    setOtpSent(true);
                }
            }

            if (type === 'sign-in') {
                const response = await signIn({
                    email: data.email,
                    password: data.password,
                })

                if (response?.error) {
                    setErrorMessage(response.error);
                } else {
                    router.push('/');
                }
            }
        } catch (error) {
            console.log(error);
            setErrorMessage(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    const handleOtpChange = (index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return;
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    }

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    }

    return (
        <section className="flex flex-col justify-center items-center w-full min-h-screen py-10 px-4 sm:px-6">
            <div className="w-full max-w-[500px] bg-white rounded-2xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <header className='flex flex-col gap-6 mb-8'>
                    <Link href="/" className="cursor-pointer flex items-center gap-3">
                        <div className="bg-[#7C5DFA] p-2.5 rounded-xl">
                            <Image
                                src="/icons/logo.svg"
                                width={24}
                                height={24}
                                alt="IDPBank logo"
                                className="brightness-0 invert"
                            />
                        </div>
                        <h1 className="text-24 font-bold text-gray-900 tracking-tight">IDPBank</h1>
                    </Link>

                    <div className="flex flex-col gap-2 mt-2">
                        <h1 className="text-26 sm:text-32 font-bold text-gray-900 tracking-tight">
                            {otpSent ? 'Verify your email' : (type === 'sign-in' ? 'Welcome Back' : 'Personal Identification')}
                        </h1>
                        <p className="text-16 font-medium text-gray-500">
                            {otpSent 
                                ? `We've sent a 6-digit code to ${form.getValues().email}`
                                : (type === 'sign-in' ? 'Please enter your details to log in.' : 'Please enter your details to sign up.')}
                        </p>
                    </div>
                </header>

                {otpSent ? (
                    <div className="flex flex-col gap-8 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between gap-2 sm:gap-3">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-24 font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#7C5DFA] focus:ring-2 focus:ring-[#7C5DFA]/20 outline-none transition-all shadow-sm"
                                />
                            ))}
                        </div>
                        <Button 
                            onClick={async () => {
                                const fullOtp = otp.join('');
                                if (fullOtp.length === 6) {
                                    setIsLoading(true);
                                    try {
                                        const res = await verifyOtp(form.getValues().email, fullOtp);
                                        if (res?.error) {
                                            setErrorMessage(res.error);
                                        } else {
                                            router.push('/');
                                        }
                                    } catch(e: any) {
                                        setErrorMessage(e?.message || "Invalid code. Please try again.");
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }
                            }}
                            disabled={isLoading || otp.join('').length < 6}
                            className="w-full bg-[#7C5DFA] hover:bg-[#6A4FE0] text-white py-6 rounded-xl font-semibold text-16 transition-all shadow-lg shadow-[#7C5DFA]/25"
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : "Verify Code"}
                        </Button>
                        <p className="text-center text-15 text-gray-500">
                            Didn&apos;t receive the code? <span className="text-[#7C5DFA] font-semibold cursor-pointer hover:underline">Resend in 00:59</span>
                        </p>
                    </div>
                ) : (
                    <>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                                {type === 'sign-up' && (
                                    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <CustomInput control={form.control} name='firstName' label="First Name" placeholder='John' />
                                            <CustomInput control={form.control} name='lastName' label="Last Name" placeholder='Doe' />
                                        </div>
                                        <CustomInput control={form.control} name='address1' label="Address" placeholder='123 Main St' />
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <CustomInput control={form.control} name='city' label="City" placeholder='New York' />
                                            <CustomInput control={form.control} name='state' label="State" placeholder='NY' />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <CustomInput control={form.control} name='postalCode' label="Postal Code" placeholder='10001' />
                                            <CustomInput control={form.control} name='dateOfBirth' label="Date of Birth" placeholder='YYYY-MM-DD' />
                                        </div>
                                        <CustomInput control={form.control} name='ssn' label="SSN" placeholder='1234' />
                                    </div>
                                )}

                                <div className="flex flex-col gap-5">
                                    <CustomInput control={form.control} name='email' label="Email Address" placeholder='john@example.com' />
                                    <CustomInput control={form.control} name='password' label="Password" placeholder='••••••••' />
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={isLoading} 
                                    className="w-full mt-4 bg-[#7C5DFA] hover:bg-[#6A4FE0] text-white py-6 rounded-xl font-semibold text-16 transition-all shadow-lg shadow-[#7C5DFA]/25"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : type === 'sign-in' ? 'Sign In' : 'Sign Up'}
                                </Button>
                            </form>
                        </Form>

                        {errorMessage && (
                            <p className="text-red-500 text-center text-14 mt-6 bg-red-50 p-4 rounded-xl border border-red-100 font-medium">{errorMessage}</p>
                        )}

                        <footer className="flex justify-center gap-2 mt-8 pt-6 border-t border-gray-100">
                            <p className="text-15 font-medium text-gray-500">
                                {type === 'sign-in'
                                    ? "Don't have an account?"
                                    : "Already have an account?"}
                            </p>
                            <Link href={type === 'sign-in' ? '/sign-up' : '/sign-in'} className="text-15 font-bold text-[#7C5DFA] hover:text-[#6A4FE0] transition-colors">
                                {type === 'sign-in' ? 'Sign up' : 'Log in'}
                            </Link>
                        </footer>
                    </>
                )}
            </div>
        </section>
    )
}

export default AuthForm