import { PrismaClient, UserRole, NovelStatus, EpisodeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Genres
  const genres = [
    { name: '판타지', slug: 'fantasy', description: '판타지 소설', sortOrder: 1, isActive: true },
    { name: '로맨스', slug: 'romance', description: '로맨스 소설', sortOrder: 2, isActive: true },
    { name: '무협', slug: 'martial-arts', description: '무협 소설', sortOrder: 3, isActive: true },
    { name: '현대', slug: 'modern', description: '현대 소설', sortOrder: 4, isActive: true },
    { name: 'SF', slug: 'sf', description: 'SF 소설', sortOrder: 5, isActive: true },
    { name: '미스터리', slug: 'mystery', description: '미스터리/추리 소설', sortOrder: 6, isActive: true },
    { name: '공포', slug: 'horror', description: '공포 소설', sortOrder: 7, isActive: true },
    { name: '스포츠', slug: 'sports', description: '스포츠 소설', sortOrder: 8, isActive: true },
    { name: '게임', slug: 'game', description: '게임 판타지 소설', sortOrder: 9, isActive: true },
    { name: '대체역사', slug: 'alt-history', description: '대체역사 소설', sortOrder: 10, isActive: true },
    { name: '라이트노벨', slug: 'light-novel', description: '라이트노벨', sortOrder: 11, isActive: true },
    { name: '자유', slug: 'free', description: '자유 장르 소설', sortOrder: 12, isActive: true },
  ];

  const genreMap = new Map<string, string>();
  for (const genre of genres) {
    const created = await prisma.genre.upsert({
      where: { name: genre.name },
      update: {},
      create: genre,
    });
    genreMap.set(genre.name, created.id);
  }

  console.log(`✅ ${genres.length} genres seeded`);

  // 2. Users (작가 3명 + 독자 2명)
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    { email: 'author1@test.com', nickname: '환상작가', role: UserRole.AUTHOR, passwordHash },
    { email: 'author2@test.com', nickname: '로맨스작가', role: UserRole.AUTHOR, passwordHash },
    { email: 'author3@test.com', nickname: '무협작가', role: UserRole.AUTHOR, passwordHash },
    { email: 'reader1@test.com', nickname: '독서광', role: UserRole.READER, passwordHash },
    { email: 'reader2@test.com', nickname: '소설마니아', role: UserRole.READER, passwordHash },
  ];

  const userMap = new Map<string, string>();
  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    userMap.set(user.nickname, created.id);
  }

  console.log(`✅ ${users.length} users seeded`);

  // 3. Author Profiles (작가 3명)
  const authorProfiles = [
    {
      userId: userMap.get('환상작가')!,
      authorName: '환상작가',
      authorBio: '판타지 세계를 그리는 작가입니다.',
    },
    {
      userId: userMap.get('로맨스작가')!,
      authorName: '로맨스작가',
      authorBio: '달콤한 사랑 이야기를 전합니다.',
    },
    {
      userId: userMap.get('무협작가')!,
      authorName: '무협작가',
      authorBio: '강호의 이야기를 담습니다.',
    },
  ];

  for (const profile of authorProfiles) {
    await prisma.authorProfile.upsert({
      where: { userId: profile.userId },
      update: {},
      create: profile,
    });
  }

  console.log(`✅ ${authorProfiles.length} author profiles seeded`);

  // 4. Novels (10개)
  const novels = [
    {
      authorId: userMap.get('환상작가')!,
      title: '마법사의 귀환',
      synopsis: '500년의 봉인에서 깨어난 대마법사의 현대 판타지',
      genreId: genreMap.get('판타지')!,
      tags: ['현대판타지', '회귀', '마법'],
      status: NovelStatus.SERIALIZING,
      totalEpisodes: 5,
      totalViews: 15230,
      totalLikes: 892,
      totalBookmarks: 234,
      totalFavorites: 156,
    },
    {
      authorId: userMap.get('환상작가')!,
      title: '던전 마스터',
      synopsis: '던전을 창조하고 운영하는 새로운 판타지',
      genreId: genreMap.get('게임')!,
      tags: ['던전', '경영', '판타지'],
      status: NovelStatus.SERIALIZING,
      totalEpisodes: 4,
      totalViews: 8420,
      totalLikes: 512,
      totalBookmarks: 98,
      totalFavorites: 67,
    },
    {
      authorId: userMap.get('로맨스작가')!,
      title: '재벌과의 계약연애',
      synopsis: '우연한 계약으로 시작된 가짜 연인, 진짜 사랑이 되다',
      genreId: genreMap.get('로맨스')!,
      tags: ['계약연애', '재벌', '달달'],
      status: NovelStatus.COMPLETED,
      totalEpisodes: 3,
      totalViews: 23450,
      totalLikes: 1523,
      totalBookmarks: 445,
      totalFavorites: 312,
    },
    {
      authorId: userMap.get('로맨스작가')!,
      title: '타임슬립 로맨스',
      synopsis: '시간을 넘어선 운명적 사랑',
      genreId: genreMap.get('로맨스')!,
      tags: ['타임슬립', '운명', '감동'],
      status: NovelStatus.SERIALIZING,
      totalEpisodes: 5,
      totalViews: 12890,
      totalLikes: 734,
      totalBookmarks: 189,
      totalFavorites: 134,
    },
    {
      authorId: userMap.get('무협작가')!,
      title: '천하제일인의 귀환',
      synopsis: '강호를 떠났던 천하제일인이 10년 만에 돌아왔다',
      genreId: genreMap.get('무협')!,
      tags: ['무협', '회귀', '강호'],
      status: NovelStatus.SERIALIZING,
      totalEpisodes: 5,
      totalViews: 19340,
      totalLikes: 1089,
      totalBookmarks: 301,
      totalFavorites: 223,
    },
    {
      authorId: userMap.get('무협작가')!,
      title: '사파의 검',
      synopsis: '정파에 버림받은 소년이 사파의 절정고수가 되기까지',
      genreId: genreMap.get('무협')!,
      tags: ['사파', '성장', '복수'],
      status: NovelStatus.DRAFT,
      totalEpisodes: 0,
      totalViews: 0,
      totalLikes: 0,
      totalBookmarks: 0,
      totalFavorites: 0,
    },
    {
      authorId: userMap.get('환상작가')!,
      title: '우주 탐험대',
      synopsis: '인류 최초 외계 행성 탐험 프로젝트',
      genreId: genreMap.get('SF')!,
      tags: ['우주', '탐험', 'SF'],
      status: NovelStatus.SERIALIZING,
      totalEpisodes: 3,
      totalViews: 6720,
      totalLikes: 389,
      totalBookmarks: 87,
      totalFavorites: 56,
    },
    {
      authorId: userMap.get('로맨스작가')!,
      title: '살인사건의 목격자',
      synopsis: '우연히 목격한 살인사건, 그리고 시작된 추적',
      genreId: genreMap.get('미스터리')!,
      tags: ['추리', '스릴러', '반전'],
      status: NovelStatus.COMPLETED,
      totalEpisodes: 4,
      totalViews: 14560,
      totalLikes: 823,
      totalBookmarks: 198,
      totalFavorites: 145,
    },
    {
      authorId: userMap.get('무협작가')!,
      title: '프로게이머의 재기',
      synopsis: '은퇴했던 전설의 프로게이머가 다시 돌아왔다',
      genreId: genreMap.get('스포츠')!,
      tags: ['e스포츠', '성장', '게임'],
      status: NovelStatus.SERIALIZING,
      totalEpisodes: 5,
      totalViews: 11230,
      totalLikes: 645,
      totalBookmarks: 156,
      totalFavorites: 112,
    },
    {
      authorId: userMap.get('환상작가')!,
      title: '폐쇄병동의 비밀',
      synopsis: '정신병원에 숨겨진 끔찍한 진실',
      genreId: genreMap.get('공포')!,
      tags: ['공포', '미스터리', '심리'],
      status: NovelStatus.DRAFT,
      totalEpisodes: 0,
      totalViews: 0,
      totalLikes: 0,
      totalBookmarks: 0,
      totalFavorites: 0,
    },
  ];

  const novelMap = new Map<string, string>();
  for (const novel of novels) {
    // Novel 테이블에는 unique 제약이 없으므로 title+authorId로 기존 확인 후 생성
    const existing = await prisma.novel.findFirst({
      where: {
        title: novel.title,
        authorId: novel.authorId,
      },
    });

    const created = existing || await prisma.novel.create({ data: novel });
    novelMap.set(novel.title, created.id);
  }

  console.log(`✅ ${novels.length} novels seeded`);

  // 5. Episodes (각 소설별로 3-5개)
  const episodeContents = [
    '그날, 나는 500년의 긴 잠에서 깨어났다. 눈을 뜨자마자 본 것은 낯선 천장이었다. 마법진의 흔적은 희미했고, 공기 중에 떠다니는 마나의 밀도는 내가 기억하는 것보다 훨씬 희박했다. "이것은..." 몸을 일으켜 주위를 둘러보니, 내가 잠들었던 봉인의 방은 이미 폐허가 되어 있었다. 천년을 버텨낼 수 있도록 설계했던 마법진들은 모두 힘을 잃었고, 벽면은 균열로 가득했다. 창문 너머로 보이는 세상은 내가 알던 그곳이 아니었다. 하늘을 찌를 듯한 높은 탑들, 땅 위를 달리는 철의 마차들, 그리고 밤하늘을 밝히는 인공의 별들. "세상이... 이렇게나 변했단 말인가?" 나는 천천히 봉인의 방을 나섰다. 내 발걸음은 불안정했지만, 마법사로서의 본능은 여전했다.',
    '던전 코어를 손에 쥔 순간, 나는 모든 것을 이해했다. 이것은 단순한 보석이 아니었다. 생명을 창조하고, 공간을 만들며, 세계를 구축할 수 있는 신의 권능이었다. "던전 마스터... 나에게 주어진 새로운 직업이군." 시스템 창이 눈앞에 펼쳐졌다. 던전의 층수, 몬스터의 배치, 함정의 설계까지 모든 것을 내 마음대로 할 수 있었다. 하지만 동시에 깨달았다. 던전을 운영하려면 마나가 필요했고, 마나를 얻으려면 모험가들이 던전에 도전해야 했다. "재미있는 게임이로군. 그렇다면..." 나는 미소를 지으며 첫 번째 던전 설계를 시작했다. 1층은 초보자들도 클리어할 수 있을 정도로, 하지만 충분히 흥미진진하게.',
    '"이 계약서에 서명만 하시면 됩니다." 그의 차가운 목소리가 회의실에 울렸다. 나는 떨리는 손으로 펜을 들었다. 계약 기간 1년, 가짜 연인 행세, 대가는 병원비 전액 지원. "정말... 이것밖에 방법이 없나요?" "당신에게 다른 선택지가 있나요?" 그의 물음에 나는 대답할 수 없었다. 어머니의 수술비, 동생의 학비, 집세까지. 나를 짓누르는 현실 앞에서 자존심 따위는 사치였다. "알겠습니다. 서명하겠습니다." 펜 끝이 종이에 닿는 순간, 내 인생은 완전히 달라졌다. 다음날부터 나는 재벌 3세 강민호의 약혼녀가 되었다. 하지만 그때는 몰랐다. 이 계약이 내 인생을 어떻게 바꿀지.',
    '시계가 12시를 가리키는 순간, 세상이 일그러졌다. "이게 무슨..." 눈을 뜨니 낯익은 천장이었다. 내 방, 하지만 10년 전의 모습으로. 책상 위의 달력은 2015년을 가리키고 있었다. "타임슬립... 설마 진짜?" 거울을 보니 20살의 내가 있었다. 아직 주름도, 흰머리도 없는. "그렇다면 이번에는..." 나는 결심했다. 10년 전 놓쳤던 그 사람을, 이번에는 절대 놓치지 않겠다고. 첫사랑 김서준. 그는 지금 대학교 2학년이고, 우리가 처음 만나는 날은 정확히 일주일 후다. "이번에는 달라질 거야." 나는 옷장을 열며 미소 지었다.',
    '강호에 소문이 돌았다. "천하제일인 검황이 돌아왔다." 10년 전, 정사대전에서 승리한 후 홀연히 사라졌던 그가 다시 나타난 것이다. "세월이 많이 흘렀구나." 나는 천천히 강호를 걸었다. 10년이라는 시간은 많은 것을 변화시켰다. 새로운 고수들이 등장했고, 옛 친구들은 나이를 먹었다. 하지만 변하지 않은 것도 있었다. 강호의 권력욕, 음모, 그리고 끝없는 싸움. "사형, 정말 당신입니까?" 무당파의 젊은 도사가 나를 알아보았다. "그래, 오랜만이구나." 나는 고개를 끄덕였다. 돌아온 이유는 단 하나. 10년 전 내가 남긴 숙제를 끝내기 위해.',
    '우주선 아르고호가 워프를 끝내고 목표 행성계에 진입했다. "선장님, 3번 행성에서 생명체 신호가 감지됩니다." "확인했다. 착륙 준비." 인류 최초의 외계 행성 탐험. 우리 5명의 대원은 역사에 이름을 남기게 될 것이다. 하지만 그때는 몰랐다. 이 행성이 우리에게 무엇을 보여줄지. "착륙 10초 전, 5, 4, 3, 2, 1..." 쿵. 아르고호가 붉은 대지에 안착했다. "자, 그럼 새로운 세계로 가볼까." 나는 헬멧을 쓰고 에어락으로 향했다.',
    '"살인사건의 목격자를 찾습니다." 신문 기사를 보는 순간, 나는 얼어붙었다. 그날 밤, 내가 본 것은 정말 현실이었던 것이다. "이런, 경찰에 신고했어야 했는데..." 하지만 이미 늦었다. 범인은 내가 목격자라는 것을 알고 있었다. 집으로 돌아가는 길에 계속 누군가의 시선이 느껴졌다. "누구세요?" 뒤를 돌아봤지만 아무도 없었다. 하지만 확신했다. 누군가 나를 쫓고 있다. 집에 도착해 문을 열려는 순간, 뒤에서 손이 나왔다. "비명 지르면 죽어."',
    '"전설이 돌아왔다!" 경기장은 환호성으로 가득했다. 3년 전 은퇴했던 프로게이머 이준혁이 다시 무대에 섰다. "떨리는데..." 마우스를 쥔 손이 미세하게 떨렸다. 하지만 게임이 시작되자 몸이 기억했다. 수천 번 반복했던 움직임, 완벽한 타이밍, 그리고 예측 불가능한 플레이. "First Blood!" 첫 킬을 따내는 순간, 관중석이 폭발했다. "역시 레전드는 다르다!" "준혁 왕의 귀환이다!" 나는 미소를 지었다. 그래, 이 느낌. 이것이 내가 그리워했던 무대다.',
  ];

  const episodeData = [
    // 마법사의 귀환 (5화)
    { novelTitle: '마법사의 귀환', episodeNumber: 1, title: '500년 만의 귀환', isFree: true, price: 0, viewCount: 3420, likeCount: 234 },
    { novelTitle: '마법사의 귀환', episodeNumber: 2, title: '변화한 세상', isFree: true, price: 0, viewCount: 3120, likeCount: 198 },
    { novelTitle: '마법사의 귀환', episodeNumber: 3, title: '현대의 마법', isFree: false, price: 3, viewCount: 2890, likeCount: 176 },
    { novelTitle: '마법사의 귀환', episodeNumber: 4, title: '첫 번째 제자', isFree: false, price: 3, viewCount: 2650, likeCount: 154 },
    { novelTitle: '마법사의 귀환', episodeNumber: 5, title: '마법 학교의 초대', isFree: false, price: 3, viewCount: 2150, likeCount: 130 },
    // 던전 마스터 (4화)
    { novelTitle: '던전 마스터', episodeNumber: 1, title: '던전 코어의 발견', isFree: true, price: 0, viewCount: 2340, likeCount: 145 },
    { novelTitle: '던전 마스터', episodeNumber: 2, title: '첫 던전 설계', isFree: true, price: 0, viewCount: 2120, likeCount: 132 },
    { novelTitle: '던전 마스터', episodeNumber: 3, title: '모험가들의 도전', isFree: false, price: 2, viewCount: 1980, likeCount: 118 },
    { novelTitle: '던전 마스터', episodeNumber: 4, title: '던전의 성장', isFree: false, price: 2, viewCount: 1980, likeCount: 117 },
    // 재벌과의 계약연애 (3화, 완결)
    { novelTitle: '재벌과의 계약연애', episodeNumber: 1, title: '계약의 시작', isFree: true, price: 0, viewCount: 8230, likeCount: 534 },
    { novelTitle: '재벌과의 계약연애', episodeNumber: 2, title: '가짜 연인', isFree: false, price: 3, viewCount: 7650, likeCount: 498 },
    { novelTitle: '재벌과의 계약연애', episodeNumber: 3, title: '진짜 사랑 (완결)', isFree: false, price: 3, viewCount: 7570, likeCount: 491 },
    // 타임슬립 로맨스 (5화)
    { novelTitle: '타임슬립 로맨스', episodeNumber: 1, title: '과거로의 귀환', isFree: true, price: 0, viewCount: 2890, likeCount: 167 },
    { novelTitle: '타임슬립 로맨스', episodeNumber: 2, title: '다시 만난 그대', isFree: true, price: 0, viewCount: 2650, likeCount: 152 },
    { novelTitle: '타임슬립 로맨스', episodeNumber: 3, title: '운명의 수정', isFree: false, price: 3, viewCount: 2430, likeCount: 141 },
    { novelTitle: '타임슬립 로맨스', episodeNumber: 4, title: '변화하는 미래', isFree: false, price: 3, viewCount: 2280, likeCount: 134 },
    { novelTitle: '타임슬립 로맨스', episodeNumber: 5, title: '새로운 시작', isFree: false, price: 3, viewCount: 1640, likeCount: 140 },
    // 천하제일인의 귀환 (5화)
    { novelTitle: '천하제일인의 귀환', episodeNumber: 1, title: '검황의 귀환', isFree: true, price: 0, viewCount: 4320, likeCount: 278 },
    { novelTitle: '천하제일인의 귀환', episodeNumber: 2, title: '변화한 강호', isFree: true, price: 0, viewCount: 3890, likeCount: 245 },
    { novelTitle: '천하제일인의 귀환', episodeNumber: 3, title: '옛 친구들', isFree: false, price: 2, viewCount: 3670, likeCount: 223 },
    { novelTitle: '천하제일인의 귀환', episodeNumber: 4, title: '새로운 도전', isFree: false, price: 2, viewCount: 3540, likeCount: 215 },
    { novelTitle: '천하제일인의 귀환', episodeNumber: 5, title: '검황의 위엄', isFree: false, price: 2, viewCount: 3920, likeCount: 228 },
    // 우주 탐험대 (3화)
    { novelTitle: '우주 탐험대', episodeNumber: 1, title: '워프 점프', isFree: true, price: 0, viewCount: 2450, likeCount: 142 },
    { novelTitle: '우주 탐험대', episodeNumber: 2, title: '붉은 행성', isFree: true, price: 0, viewCount: 2190, likeCount: 126 },
    { novelTitle: '우주 탐험대', episodeNumber: 3, title: '생명체의 흔적', isFree: false, price: 3, viewCount: 2080, likeCount: 121 },
    // 살인사건의 목격자 (4화, 완결)
    { novelTitle: '살인사건의 목격자', episodeNumber: 1, title: '그날 밤', isFree: true, price: 0, viewCount: 4120, likeCount: 243 },
    { novelTitle: '살인사건의 목격자', episodeNumber: 2, title: '추적자', isFree: false, price: 2, viewCount: 3780, likeCount: 221 },
    { novelTitle: '살인사건의 목격자', episodeNumber: 3, title: '진실에 다가서다', isFree: false, price: 2, viewCount: 3540, likeCount: 208 },
    { novelTitle: '살인사건의 목격자', episodeNumber: 4, title: '반전 (완결)', isFree: false, price: 2, viewCount: 3120, likeCount: 151 },
    // 프로게이머의 재기 (5화)
    { novelTitle: '프로게이머의 재기', episodeNumber: 1, title: '레전드의 복귀', isFree: true, price: 0, viewCount: 2560, likeCount: 156 },
    { novelTitle: '프로게이머의 재기', episodeNumber: 2, title: '첫 경기', isFree: true, price: 0, viewCount: 2340, likeCount: 142 },
    { novelTitle: '프로게이머의 재기', episodeNumber: 3, title: '완벽한 플레이', isFree: false, price: 2, viewCount: 2180, likeCount: 134 },
    { novelTitle: '프로게이머의 재기', episodeNumber: 4, title: '팀의 에이스', isFree: false, price: 2, viewCount: 2070, likeCount: 127 },
    { novelTitle: '프로게이머의 재기', episodeNumber: 5, title: '결승전을 향해', isFree: false, price: 2, viewCount: 2080, likeCount: 86 },
  ];

  let episodeCount = 0;
  for (const ep of episodeData) {
    const novelId = novelMap.get(ep.novelTitle);
    if (!novelId) continue;

    const novel = novels.find(n => n.title === ep.novelTitle);
    if (!novel) continue;

    const contentIndex = (ep.episodeNumber - 1) % episodeContents.length;
    const content = episodeContents[contentIndex];
    const wordCount = content.length;

    await prisma.episode.create({
      data: {
        novelId,
        authorId: novel.authorId,
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        content,
        wordCount,
        status: EpisodeStatus.PUBLISHED,
        isFree: ep.isFree,
        price: ep.price,
        viewCount: ep.viewCount,
        likeCount: ep.likeCount,
        publishedAt: new Date(Date.now() - (30 - ep.episodeNumber) * 24 * 60 * 60 * 1000), // 최근 30일 이내
      },
    });
    episodeCount++;
  }

  console.log(`✅ ${episodeCount} episodes seeded`);
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
