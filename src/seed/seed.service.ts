import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { AccountStatus } from 'common/enums/account-status';
import * as bcrypt from 'bcryptjs';
import { UserRole } from 'src/auth/entities/user-role.entity';
import { User } from 'src/auth/entities/user.entity';
import { UserPrivilege } from 'src/auth/entities/user-privilege.entity';
import { AllPrivileges, BusinessAdminPrivileges, StudentPrivileges } from 'common/enums/privileges';
import { RolesConstant } from 'common/enums/roles';
import { Profile } from 'src/profile/entities/profile.entity';
import { IdVerificationStatus } from 'common/enums/id-verification-status';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async seed() {
    await this.dataSource.transaction(async (manager) => {
      const userRoleRepository = manager.getRepository(UserRole);
      const userPrivilegeRepository = manager.getRepository(UserPrivilege);
      const userRepository = manager.getRepository(User);
      const profileRepository = manager.getRepository(Profile);

      // Seed Roles
      const roles = Object.values(RolesConstant);
      const createdRoles: UserRole[] = [];

      await Promise.all(
        roles.map(async (roleName) => {
          let role = await userRoleRepository.findOne({
            where: { name: roleName },
          });

          if (!role) {
            role = userRoleRepository.create({
              name: roleName,
              comment: `${roleName} role`,
            });
            await userRoleRepository.save(role);
            this.logger.log(`✅ Created role: ${roleName}`);
          } else {
            this.logger.log(`ℹ️ Role already exists: ${roleName}`);
          }

          createdRoles.push(role);
        }),
      );

      // Seed Privileges
      const privileges = Object.values(AllPrivileges);
      const createdPrivileges: UserPrivilege[] = [];

      await Promise.all(
        privileges.map(async (privilegeName) => {
          let privilege = await userPrivilegeRepository.findOne({
            where: { name: privilegeName },
          });

          if (!privilege) {
            privilege = userPrivilegeRepository.create({
              name: privilegeName,
              comment: `${privilegeName} Privilege`,
            });
            await userPrivilegeRepository.save(privilege);
            this.logger.log(`✅ Created privilege: ${privilegeName}`);
          } else {
            this.logger.log(`ℹ️ Privilege already exists: ${privilegeName}`);
          }

          createdPrivileges.push(privilege);
        }),
      );

      // Create sample users
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
            phoneNumber: '08030000003',
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
            phoneNumber: '08030000004',
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
            phoneNumber: '08030000005',
            verificationStatus: IdVerificationStatus.APPROVED,
          },
        },
      ];

      await Promise.all(
        sampleUsers.map(async (userData) => {
          const existingUser = await userRepository.findOne({
            where: { email: userData.email },
          });

          if (!existingUser) {
            const role = createdRoles.find((r) => r.name === userData.role);
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
            this.logger.log(`ℹ️ User already exists: ${userData.email}`);
          }
        }),
      );

      // Assign all privileges to SUPER_ADMIN
      const superAdminRole = createdRoles.find(
        (r) => r.name === RolesConstant.SUPER_ADMIN,
      );
      if (superAdminRole) {
        superAdminRole.userPrivileges = createdPrivileges;
        await userRoleRepository.save(superAdminRole);
        this.logger.log('✅ Assigned all privileges to SUPER_ADMIN role.');
      }

      // Assign StudentPrivileges
      const studentPrivileges = await userPrivilegeRepository.find({
        where: { name: In(Object.values(StudentPrivileges)) },
      });
      const studentRole = createdRoles.find(
        (r) => r.name === RolesConstant.STUDENT,
      );
      if (studentRole) {
        studentRole.userPrivileges = studentPrivileges;
        await userRoleRepository.save(studentRole);
        this.logger.log('✅ Assigned student privileges to STUDENT role.');
      }

      // Assign BusinessAdminPrivileges
      const businessAdminPrivileges = await userPrivilegeRepository.find({
        where: { name: In(Object.values(BusinessAdminPrivileges)) },
      });
      const businessAdminRole = createdRoles.find(
        (r) => r.name === RolesConstant.BUSINESS_ADMIN,
      );
      if (businessAdminRole) {
        businessAdminRole.userPrivileges = businessAdminPrivileges;
        await userRoleRepository.save(businessAdminRole);
        this.logger.log(
          '✅ Assigned business admin privileges to BUSINESS_ADMIN role.',
        );
      }
    });
  }
}