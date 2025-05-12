import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AccountStatus } from 'common/enums/account-status';
import * as bcrypt from 'bcryptjs';
import { UserRole } from 'src/auth/entities/user-role.entity';
import { User } from 'src/auth/entities/user.entity';
import { UserPrivilege } from 'src/auth/entities/user-privilege.entity';
import { PrivilegesConstant } from 'common/enums/privileges';
import { RolesConstant } from 'common/enums/roles';
import { Profile } from 'src/profile/entities/profile.entity'; // Import Profile
import { IdVerificationStatus } from 'common/enums/id-verification-status';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async seed() {
    const userRoleRepository = this.dataSource.getRepository(UserRole);
    const userPrivilegeRepository = this.dataSource.getRepository(UserPrivilege);
    const userRepository = this.dataSource.getRepository(User);
    const profileRepository = this.dataSource.getRepository(Profile);

    const roles = Object.values(RolesConstant);
    const createdRoles = [];

    // Seed Roles
    for (const roleName of roles) {
      let role = await userRoleRepository.findOne({ where: { name: roleName } });

      if (!role) {
        role = userRoleRepository.create({
          name: roleName,
          comment: `${roleName} role`,
        });
        await userRoleRepository.save(role);
        this.logger.log(`Created role: ${roleName}`);
      } else {
        this.logger.log(`Role already exists: ${roleName}`);
      }

      createdRoles.push(role);
    }

    // Seed Privileges
    const privileges = Object.values(PrivilegesConstant);
    const createdPrivileges = [];

    for (const privilegeName of privileges) {
      let privilege = await userPrivilegeRepository.findOne({ where: { name: privilegeName } });

      if (!privilege) {
        privilege = userPrivilegeRepository.create({
          name: privilegeName,
          comment: `${privilegeName} Privilege`,
        });
        await userPrivilegeRepository.save(privilege);
        this.logger.log(`Created Privilege: ${privilegeName}`);
      } else {
        this.logger.log(`Privilege already exists: ${privilegeName}`);
      }

      createdPrivileges.push(privilege);
    }

    const passwordHash = await bcrypt.hash('Password@1234', 10);

    const sampleUsers = [
      {
        email: 'lexico4real@gmail.com',
        password: passwordHash,
        role: RolesConstant.SUPER_ADMIN,
        profile: {
          firstName: 'Super',
          lastName: 'Admin',
          phoneNumber: '08030000001',
          verificationStatus: IdVerificationStatus.APPROVED,
        },
      },
      {
        email: 'admin@fastr.com',
        password: passwordHash,
        role: RolesConstant.ADMIN,
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          phoneNumber: '08030000002',
          verificationStatus: IdVerificationStatus.APPROVED,
        },
      },
      {
        email: 'student@fastr.com',
        password: passwordHash,
        role: RolesConstant.STUDENT,
        profile: {
          firstName: 'Student',
          lastName: 'User',
          phone: '08030000003',
          verificationStatus: IdVerificationStatus.APPROVED,
        },
      },
      {
        email: 'business@fastr.com',
        password: passwordHash,
        role: RolesConstant.BUSINESS,
        profile: {
          firstName: 'Business',
          lastName: 'User',
          phone: '08030000004',
          verificationStatus: IdVerificationStatus.APPROVED,
        },
      },
      {
        email: 'business_admin@fastr.com',
        password: passwordHash,
        role: RolesConstant.BUSINESS_ADMIN,
        profile: {
          firstName: 'Business',
          lastName: 'Admin',
          phone: '08030000005',
          verificationStatus: IdVerificationStatus.APPROVED,
        },
      },
    ];

    for (const userData of sampleUsers) {
      const existingUser = await userRepository.findOne({ where: { email: userData.email } });

      if (!existingUser) {
        const role = createdRoles.find(r => r.name === userData.role);
        const user = userRepository.create({
          email: userData.email,
          password: userData.password,
          accountStatus: AccountStatus.ACTIVE,
          isEmailVerified: true,
          userRole: role,
        });

        const savedUser = await userRepository.save(user);

        const profile = profileRepository.create({
          ...userData.profile,
          user: savedUser,
        });

        await profileRepository.save(profile);
        this.logger.log(`✅ Created user and profile: ${userData.email}`);
      } else {
        this.logger.log(`User already exists: ${userData.email}`);
      }
    }

    // Assign all privileges to SUPER_ADMIN role
    const superAdminRole = await userRoleRepository.findOne({
      where: { name: RolesConstant.SUPER_ADMIN },
      relations: ['userPrivileges'],
    });

    if (superAdminRole) {
      superAdminRole.userPrivileges = createdPrivileges;
      await userRoleRepository.save(superAdminRole);
      this.logger.log('✅ Assigned all privileges to SUPER_ADMIN role.');
    } else {
      this.logger.warn('⚠️ SUPER_ADMIN role not found.');
    }
  }
}
