import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { PageLayout } from "@/components/PageLayout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfile } from "@shared/schema";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";

export const ProfileSetup = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      contactNumber: "",
      country: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        contactNumber: user.contactNumber ?? "",
        country: user.country ?? "",
      });
    }
  }, [user]);

  const saveProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const res = await apiRequest("POST", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile saved successfully" });
      setLocation("/investor-question");
    },
    onError: () => {
      toast({ title: "Failed to save profile", variant: "destructive" });
    },
  });

  const onSubmit = (data: UpdateProfile) => {
    saveProfileMutation.mutate(data);
  };

  return (
    <PageLayout>
      <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm md:max-w-md">
        <img
          className="w-[60px] h-[60px] md:w-[75px] md:h-[75px]"
          alt="Playground logo"
          src="/figmaAssets/frame.svg"
          data-testid="img-logo"
        />

        <p
          className="font-['Aclonica',sans-serif] text-[#34e916] text-base md:text-lg leading-normal mt-4 w-full"
          data-testid="text-welcome"
        >
          Welcome to Playground. Lets get started with play profile
        </p>

        <img
          className="w-[100px] h-[100px] md:w-[125px] md:h-[125px] mt-4"
          alt="Profile"
          src={user?.profileImageUrl || "/figmaAssets/account-circle.svg"}
          style={{ borderRadius: user?.profileImageUrl ? "50%" : undefined }}
          data-testid="img-profile"
        />

        {user && (user.firstName || user.lastName) && (
          <p className="font-['Roboto',Helvetica] text-white text-lg font-medium mt-3" data-testid="text-user-name">
            {[user.firstName, user.lastName].filter(Boolean).join(" ")}
          </p>
        )}
        {user?.handle && (
          <p className="font-['Roboto',Helvetica] text-white/60 text-sm" data-testid="text-user-handle">
            @{user.handle}
          </p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full mt-8 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="First Name"
                        {...field}
                        data-testid="input-first-name"
                        className="h-[50px] bg-white text-black rounded-md font-['Aclonica',sans-serif] text-sm border-none"
                      />
                    </FormControl>
                    <FormMessage className="text-yellow-200" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="Last Name"
                        {...field}
                        data-testid="input-last-name"
                        className="h-[50px] bg-white text-black rounded-md font-['Aclonica',sans-serif] text-sm border-none"
                      />
                    </FormControl>
                    <FormMessage className="text-yellow-200" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Contact number"
                      {...field}
                      data-testid="input-contact"
                      className="h-[50px] bg-white text-black rounded-md font-['Aclonica',sans-serif] text-sm border-none w-full"
                    />
                  </FormControl>
                  <FormMessage className="text-yellow-200" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Country of residence"
                      {...field}
                      data-testid="input-country"
                      className="h-[50px] bg-white text-black rounded-md font-['Aclonica',sans-serif] text-sm border-none w-full"
                    />
                  </FormControl>
                  <FormMessage className="text-yellow-200" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={saveProfileMutation.isPending}
              className="mt-4 h-[50px] bg-white hover:bg-white/90 text-black rounded-md font-['Aclonica',sans-serif] text-sm w-full"
              variant="secondary"
              data-testid="button-continue"
            >
              {saveProfileMutation.isPending ? "Saving..." : "Save & Continue"}
            </Button>
          </form>
        </Form>
      </div>
    </PageLayout>
  );
};
