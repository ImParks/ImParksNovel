import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class SignUpInput {
  @Field()
  @IsEmail({}, { message: '유효한 이메일 형식이어야 합니다.' })
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @IsNotEmpty()
  password: string;

  @Field()
  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  @MaxLength(20, { message: '닉네임은 최대 20자까지 가능합니다.' })
  @IsNotEmpty()
  nickname: string;

  @Field()
  agreeToTerms: boolean;

  @Field()
  agreeToPrivacy: boolean;
}

@InputType()
export class SignInInput {
  @Field()
  @IsEmail({}, { message: '유효한 이메일 형식이어야 합니다.' })
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  password: string;
}

@InputType()
export class UpdateProfileInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  @MaxLength(20, { message: '닉네임은 최대 20자까지 가능합니다.' })
  nickname?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl({}, { message: '유효한 URL 형식이어야 합니다.' })
  profileImageUrl?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '소개는 최대 500자까지 가능합니다.' })
  bio?: string;
}

@InputType()
export class ApplyForAuthorInput {
  @Field()
  @IsString()
  @MinLength(2, { message: '작가명은 최소 2자 이상이어야 합니다.' })
  @MaxLength(50, { message: '작가명은 최대 50자까지 가능합니다.' })
  @IsNotEmpty()
  authorName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: '작가 소개는 최대 1000자까지 가능합니다.' })
  authorBio?: string;
}

@InputType()
export class UpdateAuthorProfileInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  authorName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  authorBio?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  bankName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  accountHolder?: string;
}

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  token: string;

  @Field()
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @IsNotEmpty()
  newPassword: string;
}
