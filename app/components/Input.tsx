"use client";
import { Button } from "@/components/ui/button";
import { FormField, FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import React from "react";
import { useFormContext } from "react-hook-form";

const InputForm = ({
  name,
  placeholder,
  type,
  icon: Icon,
}: {
  name: string;
  placeholder: string;
  type?: string;
  icon?: React.ElementType;
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const form = useFormContext();

  return (
    <div>
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="relative">
                {Icon && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Icon className="h-5 w-5" />
                  </div>
                )}

                {type === "password" ? (
                  <>
                    <Input
                      placeholder={placeholder}
                      type={showPassword ? "text" : "password"}
                      {...field}
                      className="bg-[#2d2d2d] border-gray-700 text-white placeholder:text-gray-400 pl-10 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute cursor-pointer right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </>
                ) : (
                  <Input
                    placeholder={placeholder}
                    {...field}
                    type={type || "text"}
                    className="bg-[#2d2d2d] border-gray-700 text-white placeholder:text-gray-400 pl-10"
                  />
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default InputForm;
