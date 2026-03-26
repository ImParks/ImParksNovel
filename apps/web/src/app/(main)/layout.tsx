import { MainLayout } from '@/components/templates';

interface MainGroupLayoutProps {
  children: React.ReactNode;
}

export default function MainGroupLayout({
  children,
}: MainGroupLayoutProps) {
  return <MainLayout>{children}</MainLayout>;
}
