import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

const statusIcons = [
  {
    src: "/figmaAssets/network-wifi.svg",
    alt: "Network wifi",
    className: "w-6 h-6",
  },
  {
    src: "/figmaAssets/network-cell.svg",
    alt: "Network cell",
    className: "w-6 h-6",
  },
  {
    src: "/figmaAssets/battery-std.svg",
    alt: "Battery std",
    className: "w-6 h-6",
  },
];

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
    <div className="bg-[#2e99e6] w-full min-w-[411px] min-h-screen flex flex-col">
      <header className="flex justify-end items-center gap-2 p-2">
        {statusIcons.map((icon, index) => (
          <img
            key={`status-icon-${index}`}
            className={icon.className}
            alt={icon.alt}
            src={icon.src}
          />
        ))}
      </header>

      <main className="flex-1 flex flex-col items-center px-8 pt-4">
        <img
          className="w-[75px] h-[75px]"
          alt="Playground logo"
          src="/figmaAssets/frame.svg"
        />

        <p className="font-['Aclonica',sans-serif] text-[#34e916] text-[18px] leading-normal mt-4 w-full max-w-[349px]">
          Welcome to Playground. Lets get started with play profile
        </p>

        <img
          className="w-[125px] h-[125px] mt-4"
          alt="Profile"
          src="/figmaAssets/account-circle.svg"
        />

        <div className="flex gap-4 w-full max-w-[349px] mt-8">
          <Input
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-[50px] bg-white text-black rounded-md font-['Aclonica',sans-serif] text-[13px] border-none"
          />
          <Input
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="h-[50px] bg-white text-black rounded-md font-['Aclonica',sans-serif] text-[13px] border-none"
          />
        </div>

        <Input
          placeholder="Contact number"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          className="h-[50px] bg-white text-black rounded-md font-['Aclonica',sans-serif] text-[13px] border-none w-full max-w-[349px] mt-4"
        />

        <Input
          placeholder="Country of residence"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="h-[50px] bg-white text-black rounded-md font-['Aclonica',sans-serif] text-[13px] border-none w-full max-w-[349px] mt-4"
        />

        <Button
          onClick={handleSubmit}
          className="mt-8 h-[50px] bg-white hover:bg-white/90 text-black rounded-md font-['Aclonica',sans-serif] text-[13px] w-full max-w-[349px]"
          variant="secondary"
        >
          Continue
        </Button>
      </main>
    </div>
  );
};
