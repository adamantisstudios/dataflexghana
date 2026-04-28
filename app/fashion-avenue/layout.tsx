import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fashion Avenue - Professional Fashion Design Services',
  description: 'Request custom fashion design projects and refer friends to our professional fashion design services.',
  keywords: ['fashion design', 'custom design', 'fashion consultation', 'professional services'],
  openGraph: {
    title: 'Fashion Avenue',
    description: 'Professional fashion design services tailored to your unique style and vision',
    type: 'website',
    url: '/fashion-avenue',
  },
};

export default function FashionAvenueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
