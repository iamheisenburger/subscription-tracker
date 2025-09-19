import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
              card: "shadow-lg",
            },
          }}
        />
      </div>
    </div>
  );
}

