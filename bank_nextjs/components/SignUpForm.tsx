"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Shield, ShieldCheck } from "lucide-react";

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      postalCode: "",
      dateOfBirth: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    console.log("Form submitted:", data);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#FAFBFC]">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between p-8 xl:p-12 bg-white">
        <div className="flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-[#1E293B]">IDPBank</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl xl:text-5xl font-serif font-normal text-[#1E293B] leading-tight mb-6">
            Begin Your Wealth
            <br />
            Journey.
          </h1>

          {/* Description */}
          <p className="text-[#64748B] text-base leading-relaxed max-w-sm">
            Experience a new standard of private banking designed for the digital age. Precision, security, and editorial clarity in every transaction.
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="relative mt-8 max-w-sm">
          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/images/auth-testimonial.jpg"
              alt="Professional corridor"
              width={400}
              height={300}
              className="w-full h-[280px] object-cover"
            />
            {/* Overlay with quote */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1E3A5F]/95 via-[#1E3A5F]/80 to-transparent p-6 pt-16">
              <p className="text-white text-sm leading-relaxed mb-3">
                &quot;The most sophisticated financial platform I&apos;ve ever used. It feels like an extension of my lifestyle.&quot;
              </p>
              <p className="text-white/70 text-sm">
                — Julian Vance, Portfolio Manager
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8 xl:p-12">
        <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-sm border border-gray-100 p-8 xl:p-10">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-semibold text-[#3B82F6] tracking-wider">
              STEP 01 / 04
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-2 bg-[#3B82F6] rounded-full"></div>
              <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1E293B] mb-2">
              Personal Identification
            </h2>
            <p className="text-[#64748B] text-sm">
              Securely verify your identity to access premium features.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] tracking-wider mb-2">
                  FIRST NAME
                </label>
                <input
                  {...register("firstName")}
                  type="text"
                  placeholder="e.g. Alexander"
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 text-[#1E293B] placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors bg-transparent"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] tracking-wider mb-2">
                  LAST NAME
                </label>
                <input
                  {...register("lastName")}
                  type="text"
                  placeholder="e.g. Sterling"
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 text-[#1E293B] placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors bg-transparent"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] tracking-wider mb-2">
                ADDRESS
              </label>
              <input
                {...register("address")}
                type="text"
                placeholder="123 Signature Way"
                className="w-full px-0 py-2 border-0 border-b border-gray-200 text-[#1E293B] placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors bg-transparent"
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
              )}
            </div>

            {/* City & Postal Code */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] tracking-wider mb-2">
                  CITY
                </label>
                <input
                  {...register("city")}
                  type="text"
                  placeholder="New York"
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 text-[#1E293B] placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors bg-transparent"
                />
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] tracking-wider mb-2">
                  POSTAL CODE
                </label>
                <input
                  {...register("postalCode")}
                  type="text"
                  placeholder="10001"
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 text-[#1E293B] placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors bg-transparent"
                />
                {errors.postalCode && (
                  <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>
                )}
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] tracking-wider mb-2">
                DATE OF BIRTH
              </label>
              <input
                {...register("dateOfBirth")}
                type="text"
                placeholder="mm/dd/yyyy"
                className="w-full px-0 py-2 border-0 border-b border-gray-200 text-[#1E293B] placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors bg-transparent"
              />
              {errors.dateOfBirth && (
                <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] tracking-wider mb-2">
                EMAIL ADDRESS
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="alexander@sterling.com"
                className="w-full px-0 py-2 border-0 border-b border-gray-200 text-[#1E293B] placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors bg-transparent"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] tracking-wider mb-2">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="w-full px-0 py-2 pr-10 border-0 border-b border-gray-200 text-[#1E293B] placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3.5 bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Signing Up...</span>
                </div>
              ) : (
                "Sign Up"
              )}
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-[#64748B] mt-4">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-[#3B82F6] font-medium hover:underline">
                Log In
              </Link>
            </p>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
              <Shield className="w-3.5 h-3.5" />
              <span>256-BIT ENCRYPTION</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>FDIC INSURED</span>
            </div>
          </div>

          <p className="text-center text-xs text-[#94A3B8] mt-4">
            © 2026 IDPBank. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
