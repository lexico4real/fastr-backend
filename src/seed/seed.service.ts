import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AccountStatus } from 'common/enums/account-status';
import * as bcrypt from 'bcryptjs';
import { UserRole } from 'src/auth/entities/user-role.entity';
import { User } from 'src/auth/entities/user.entity';
import { UserPrivilege } from 'src/auth/entities/user-privilege.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }

  async seed() {
    const userRoleRepository = this.dataSource.getRepository(UserRole);
    const userPrivilegeRepository = this.dataSource.getRepository(UserPrivilege);
    const userRepository = this.dataSource.getRepository(User);

    const roles = ['admin', 'talent', 'business_owner'];
    const createdRoles = [];

    try {
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

    } catch (error) { }

    const privileges = ['can_create_staff', 'can_view_dashboard', 'can_delete_user', 'can_update_profile', 'can_create_role', 'can_create_privilege', 'can_view_users'];
    const createdPrivileges = [];

    try {
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
    } catch (error) { }

    const passwordHash = await bcrypt.hash('Password@1234', 10);

    const sampleUsers = [
      {
        email: 'lexico4real@gmail.com',
        password: passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: '08020796658',
        accountStatus: AccountStatus.ACTIVE,
        isConfirmed: true,
        userRole: createdRoles.find((role) => role.name === 'admin'),
      },
      {
        email: 'admin@fastr.com',
        password: passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: '08030000001',
        accountStatus: AccountStatus.ACTIVE,
        isConfirmed: true,
        userRole: createdRoles.find((role) => role.name === 'admin'),
      },
      {
        email: 'talent@fastr.com',
        password: passwordHash,
        firstName: 'Talent',
        lastName: 'User',
        phoneNumber: '08030000002',
        accountStatus: AccountStatus.ACTIVE,
        isConfirmed: true,
        userRole: createdRoles.find((role) => role.name === 'talent'),
      },
      {
        email: 'business@fastr.com',
        password: passwordHash,
        firstName: 'Business',
        lastName: 'Owner',
        phoneNumber: '08030000003',
        accountStatus: AccountStatus.ACTIVE,
        isConfirmed: true,
        userRole: createdRoles.find((role) => role.name === 'business_owner'),
      },
    ];

    try {
      for (const userData of sampleUsers) {
        const existingUser = await userRepository.findOne({ where: { email: userData.email } });

        if (!existingUser) {
          const user = userRepository.create(userData);
          await userRepository.save(user);
          this.logger.log(`Created user: ${userData.email}`);
        } else {
          this.logger.log(`User already exists: ${userData.email}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to create role', error);
    }

    try {
      const adminRole = await userRoleRepository.findOne({
        where: { name: 'admin' },
        relations: ['userPrivileges'],
      });

      const allPrivileges = await userPrivilegeRepository.find();

      if (adminRole) {
        adminRole.userPrivileges = allPrivileges;
        await userRoleRepository.save(adminRole);
        this.logger.log('✅ Assigned all privileges to admin role.');
      } else {
        this.logger.warn('⚠️ Admin role not found.');
      }
    } catch (error) {
      this.logger.error('Failed to assign privileges to admin role', error);
    }
  }
}
