import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { UserAccountButton } from "@/components/UserAccountButton";
import { CompanyFooter } from "@/components/CompanyFooter";

export const ProfileSetup = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [country, setCountry] = useState("");

  const handleSubmit = () => {
    if (firstName && lastName && contactNumber && country) {
      setLocation("/investor-question");
    }
  };

  return (
    <div className="bg-[#2e99e6] w-full min-h-screen flex flex-col">
      <header className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 sm:px-6">
        <UserAccountButton />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 md:justify-center">
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
            src="/figmaAssets/account-circle.svg"
            data-testid="img-profile"
          />

          <div className="flex flex-col sm:flex-row gap-4 w-full mt-8">
            <Input
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              data-testid="input-first-name"
              className="h-[50px] bg-white text-black rounded-md font-['Aclonica',sans-serif] text-sm border-none"
            />
            <Input
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              data-testid="input-last-name"
              className="h-[50px] bg-white text-black rounded-md font-['Aclonica',sans-serif] text-sm border-none"
            />
          </div>

          <Input
            placeholder="Contact number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            data-testid="input-contact"
            className="h-[50px] bg-white text-black rounded-md font-['Aclonica',sans-serif] text-sm border-none w-full mt-4"
          />

          <Input
            placeholder="Country of residence"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            data-testid="input-country"
            className="h-[50px] bg-white text-black rounded-md font-['Aclonica',sans-serif] text-sm border-none w-full mt-4"
          />

          <Button
            onClick={handleSubmit}
            className="mt-8 h-[50px] bg-white hover:bg-white/90 text-black rounded-md font-['Aclonica',sans-serif] text-sm w-full"
            variant="secondary"
            data-testid="button-continue"
          >
            Continue
          </Button>
        </div>
      </main>

      <CompanyFooter variant="blue" />
    </div>
  );
};
