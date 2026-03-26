import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';

// ──────────────────────────────────────────────
// Coin charge
// ──────────────────────────────────────────────

@InputType()
export class ConfirmChargeInput {
  @Field()
  @IsString()
  orderId: string;

  @Field()
  @IsString()
  paymentKey: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  amount: number;
}

// ──────────────────────────────────────────────
// Membership subscription
// ──────────────────────────────────────────────

@InputType()
export class ConfirmSubscriptionInput {
  @Field()
  @IsString()
  orderId: string;

  @Field()
  @IsString()
  paymentKey: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  amount: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  billingKey?: string;
}

// ──────────────────────────────────────────────
// Sponsorship
// ──────────────────────────────────────────────

@InputType()
export class SponsorInput {
  @Field()
  @IsString()
  authorId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  coinAmount: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
