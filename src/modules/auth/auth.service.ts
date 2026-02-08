import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const company = await this.prisma.company.upsert({
      where: { slug: dto.companySlug },
      update: { name: dto.companyName },
      create: { name: dto.companyName, slug: dto.companySlug },
    });

    const existing = await this.prisma.user.findUnique({
      where: {
        email_activeCompanyId: {
          email: dto.email,
          activeCompanyId: company.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Bu şirkette bu email ile kullanıcı zaten var.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          passwordHash,
          activeCompanyId: company.id,
        },
      });

      await tx.userCompany.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: 'owner',
          isActive: true,
        },
      });

      return { user, company };
    });

    const accessToken = await this.signAccessToken(
      result.user.id,
      result.company.id,
    );

    return {
      accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
      },
      company: {
        id: result.company.id,
        slug: result.company.slug,
        name: result.company.name,
      },
    };
  }

  async login(dto: LoginDto) {
    const company = await this.prisma.company.findUnique({
      where: { slug: dto.companySlug },
    });

    if (!company) {
      throw new UnauthorizedException(
        'Şirket bulunamadı veya giriş bilgileri hatalı.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {
        email_activeCompanyId: {
          email: dto.email,
          activeCompanyId: company.id,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email veya şifre hatalı.');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Email veya şifre hatalı.');
    }

    const accessToken = await this.signAccessToken(user.id, company.id);

    return {
      accessToken,
      user: { id: user.id, email: user.email, fullName: user.fullName },
      company: { id: company.id, slug: company.slug, name: company.name },
    };
  }

  private async signAccessToken(userId: string, companyId: string) {
    return this.jwt.signAsync(
      { companyId },
      { subject: userId, expiresIn: '15m' },
    );
  }
}
