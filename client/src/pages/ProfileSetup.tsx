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
  FormLabel,
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
      if (!user?.profileCompleted) {
        setLocation("/link-institution");
      }
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
      <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        <div className="flex flex-col items-center mb-6">
          {user?.profileImageUrl ? (
            <img
              className="w-20 h-20 rounded-full object-cover shadow-sm"
              alt="Profile"
              src={user.profileImageUrl}
              data-testid="img-profile"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center" data-testid="img-profile">
              <span className="text-primary text-2xl font-semibold">
                {(user?.firstName?.[0] || "U").toUpperCase()}
              </span>
            </div>
          )}

          {user && (user.firstName || user.lastName) && (
            <p className="text-foreground text-lg font-semibold mt-3" data-testid="text-user-name">
              {[user.firstName, user.lastName].filter(Boolean).join(" ")}
            </p>
          )}
          {user?.handle && (
            <p className="text-muted-foreground text-sm" data-testid="text-user-handle">
              @{user.handle}
            </p>
          )}
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 w-full">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs text-muted-foreground">First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="First Name"
                          {...field}
                          data-testid="input-first-name"
                          className="h-11 rounded-xl bg-muted/50 border-border text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs text-muted-foreground">Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Last Name"
                          {...field}
                          data-testid="input-last-name"
                          className="h-11 rounded-xl bg-muted/50 border-border text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Contact Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contact number"
                        {...field}
                        data-testid="input-contact"
                        className="h-11 rounded-xl bg-muted/50 border-border text-sm w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Country of Residence</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Country of residence"
                        {...field}
                        data-testid="input-country"
                        className="h-11 rounded-xl bg-muted/50 border-border text-sm w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={saveProfileMutation.isPending}
                className="mt-2 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium w-full"
                data-testid="button-continue"
              >
                {saveProfileMutation.isPending ? "Saving..." : user?.profileCompleted ? "Save" : "Save & Continue"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </PageLayout>
  );
};
