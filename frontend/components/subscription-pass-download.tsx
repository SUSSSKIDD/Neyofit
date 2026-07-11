'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { PDFGenerator, SubscriptionPassData } from '@/lib/pdf-generator';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPassDownloadProps {
  subscription: {
    _id: string;
    startDate: string;
    endDate: string;
    status: string;
    subscriptionListingId: {
      _id: string;
      name: string;
      description?: string;
      durationInDays: number;
      cost: number;
      currency: string;
      features?: string[];
    };
  };
  user: {
    name: string;
    email: string;
    phone: string;
  };
  gym: {
    name: string;
    location?: {
      address: {
        street: string;
        city: string;
        state: string;
        pincode: string;
      };
    };
    contact?: {
      phone?: string;
      email?: string;
    };
  };
}

export default function SubscriptionPassDownload({
  subscription,
  user,
  gym,
}: SubscriptionPassDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownloadPass = async () => {
    try {
      setIsGenerating(true);

      // Prepare the data for PDF generation
      const passData: SubscriptionPassData = {
        subscriptionId: subscription._id,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
        gymName: gym.name,
        gymAddress: gym.location 
          ? `${gym.location.address.street}, ${gym.location.address.city}, ${gym.location.address.state} - ${gym.location.address.pincode}`
          : 'Address not available',
        gymPhone: gym.contact?.phone || 'Contact not available',
        subscriptionName: subscription.subscriptionListingId.name,
        subscriptionDescription: subscription.subscriptionListingId.description || '',
        durationInDays: subscription.subscriptionListingId.durationInDays,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        cost: subscription.subscriptionListingId.cost,
        currency: subscription.subscriptionListingId.currency,
        features: subscription.subscriptionListingId.features || [],
      };

      // Generate and download the PDF
      await PDFGenerator.generateSubscriptionPass(passData);

      toast({
        title: 'Pass Downloaded Successfully!',
        description: 'Your gym membership pass has been downloaded.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Download Failed',
        description: 'There was an error generating your pass. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleDownloadPass}
      disabled={isGenerating || subscription.status !== 'active'}
      className="w-full sm:w-auto"
      variant="outline"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Pass...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download Pass
        </>
      )}
    </Button>
  );
}
