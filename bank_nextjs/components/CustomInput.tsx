import React from 'react'
import {FormControl, FormField, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Control, FieldPath, FieldValues} from 'react-hook-form'

interface CustomInputProps<T extends FieldValues> {
    control: Control<T>,
    name: FieldPath<T>,
    label: string,
    placeholder: string
}

const CustomInput = <T extends FieldValues>({ control , name, label, placeholder}: CustomInputProps<T>) => {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <div className="flex flex-col gap-2">
                    <FormLabel className="text-14 font-semibold text-gray-700">
                        {label}
                    </FormLabel>
                    <FormControl>
                        <Input
                            placeholder={placeholder}
                            className="text-16 placeholder:text-14 placeholder:text-gray-400 bg-white border border-gray-200 rounded-xl px-4 py-6 text-gray-900 focus:border-[#7C5DFA] focus:ring-2 focus:ring-[#7C5DFA]/20 transition-all outline-none shadow-sm"
                            type={name === 'password' ? 'password' : 'text'}
                            {...field}
                        />
                    </FormControl>
                    <FormMessage className="text-13 text-red-500 mt-1 font-medium" />
                </div>
            )}
        />
    )
}

export default CustomInput
