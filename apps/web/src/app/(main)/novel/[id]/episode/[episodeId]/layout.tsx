export default function EpisodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 뷰어 전용 레이아웃: Header/Footer 제외
  return children;
}
