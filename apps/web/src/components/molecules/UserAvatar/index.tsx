import { Avatar, type AvatarProps } from '@/components/atoms';

interface UserAvatarProps {
  nickname: string;
  src?: string;
  size?: AvatarProps['size'];
  className?: string;
}

function UserAvatar({ nickname, src, size = 'sm', className = '' }: UserAvatarProps) {
  return (
    <div
      className={[
        'inline-flex items-center gap-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Avatar src={src} alt={nickname} size={size} fallback={nickname.slice(0, 2)} />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
        {nickname}
      </span>
    </div>
  );
}

export { UserAvatar };
export type { UserAvatarProps };
