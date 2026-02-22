import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { Mail, MessageSquare, Bell } from "lucide-react";

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

  const { data: notifSettings } = useQuery<{ emailNotifications: boolean; textNotifications: boolean }>({
    queryKey: ["/api/notifications/settings"],
    enabled: !!user?.profileCompleted,
  });

  const updateNotifMutation = useMutation({
    mutationFn: async (settings: { emailNotifications: boolean; textNotifications: boolean }) => {
      const res = await apiRequest("PUT", "/api/notifications/settings", settings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/settings"] });
      toast({ title: "Notification settings updated" });
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    },
  });

  const handleToggle = (key: "emailNotifications" | "textNotifications", value: boolean) => {
    if (!notifSettings) return;
    updateNotifMutation.mutate({
      ...notifSettings,
      [key]: value,
    });
  };

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

        {user?.profileCompleted && (
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 w-full mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="text-foreground font-semibold text-sm">Notification Settings</h3>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">Email Notifications</p>
                    <p className="text-muted-foreground text-xs">Receive emails for connection requests</p>
                  </div>
                </div>
                <Switch
                  checked={notifSettings?.emailNotifications ?? true}
                  onCheckedChange={(checked) => handleToggle("emailNotifications", checked)}
                  disabled={updateNotifMutation.isPending}
                  data-testid="switch-email-notifications"
                />
              </div>

              <div className="border-t border-border" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">Text Notifications</p>
                    <p className="text-muted-foreground text-xs">Receive SMS for connection requests</p>
                  </div>
                </div>
                <Switch
                  checked={notifSettings?.textNotifications ?? false}
                  onCheckedChange={(checked) => handleToggle("textNotifications", checked)}
                  disabled={updateNotifMutation.isPending}
                  data-testid="switch-text-notifications"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
