import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fashion Avenue - Professional Fashion Design Services',
  description: 'Request custom fashion design projects and refer friends to our professional fashion design services.',
  keywords: ['fashion design', 'custom design', 'fashion consultation', 'professional services'],
  openGraph: {
    title: 'Fashion Avenue',
    description: 'Professional fashion design services tailored to your unique style and vision',
    type: 'website',
    url: 'https://dataflexghana.com/fashion-avenue',
    images: [
      {
        url: '/ad1-placeholder.jpg',
        width: 1080,
        height: 1080,
        alt: 'Fashion Avenue - Professional Fashion Design Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fashion Avenue',
    description: 'Professional fashion design services tailored to your unique style and vision',
    images: ['/ad1-placeholder.jpg'],
  },
};

export default function FashionAvenueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
