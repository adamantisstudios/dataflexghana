/**
 * Search Limit Exceeded Card
 * Displayed when user reaches their daily search limit
 * Redirects to https://registrypoint.netlify.app/ after 7 seconds
 */
"use client"
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Phone } from "lucide-react";

export default function SearchLimitExceededCard() {
  const message =
    "You have used your 7 free searches for today. To continue searching for candidates, please contact our support team for priority access.";
  const phoneNumber = "+233 546 460 945";

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "https://registrypoint.netlify.app/";
    }, 7000); // 7 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <AlertCircle className="h-8 w-8 text-blue-600 flex-shrink-0 mx-auto sm:mx-0 sm:mt-0.5" />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-lg text-blue-900 mb-2">Daily Search Limit Reached</h3>
            <p className="text-blue-800 mb-4">{message}</p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
              <a href={`tel:${phoneNumber.replace(/\s/g, "")}`} className="flex items-center justify-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Admin: {phoneNumber}
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
