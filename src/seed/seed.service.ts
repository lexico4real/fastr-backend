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

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) { }

  async seed() {
    const userRoleRepository = this.dataSource.getRepository(UserRole);
    const userPrivilegeRepository =
      this.dataSource.getRepository(UserPrivilege);
    const userRepository = this.dataSource.getRepository(User);

    const roles = Object.values(RolesConstant);
    const createdRoles = [];

    try {
      for (const roleName of roles) {
        let role = await userRoleRepository.findOne({
          where: { name: roleName },
        });

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
    } catch (error) {
      this.logger.log('Error creating roles');
    }

    const privileges = Object.values(PrivilegesConstant);
    const createdPrivileges = [];

    try {
      for (const privilegeName of privileges) {
        let privilege = await userPrivilegeRepository.findOne({
          where: { name: privilegeName },
        });

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
        userRole: createdRoles.find((role) => role.name === RolesConstant.SUPER_ADMIN),
      },
      {
        email: 'admin@fastr.com',
        password: passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: '08030000001',
        accountStatus: AccountStatus.ACTIVE,
        isConfirmed: true,
        userRole: createdRoles.find((role) => role.name === RolesConstant.ADMIN),
      },
      {
        email: 'student@fastr.com',
        password: passwordHash,
        firstName: 'Student',
        lastName: 'User',
        phoneNumber: '08030000002',
        accountStatus: AccountStatus.ACTIVE,
        isConfirmed: true,
        userRole: createdRoles.find((role) => role.name === RolesConstant.STUDENT),
      },
      {
        email: 'business@fastr.com',
        password: passwordHash,
        firstName: 'Business',
        lastName: 'Owner',
        phoneNumber: '08030000003',
        accountStatus: AccountStatus.ACTIVE,
        isConfirmed: true,
        userRole: createdRoles.find((role) => role.name === RolesConstant.BUSINESS),
      },
      {
        email: 'business_admin@fastr.com',
        password: passwordHash,
        firstName: 'Business',
        lastName: 'Admin',
        phoneNumber: '08030000004',
        accountStatus: AccountStatus.ACTIVE,
        isConfirmed: true,
        userRole: createdRoles.find((role) => role.name === RolesConstant.BUSINESS_ADMIN),
      },
    ];

    try {
      for (const userData of sampleUsers) {
        const existingUser = await userRepository.findOne({
          where: { email: userData.email },
        });

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
      const superAdminRole = await userRoleRepository.findOne({
        where: { name: 'SUPER_ADMIN' },
        relations: ['userPrivileges'],
      });

      const allPrivileges = await userPrivilegeRepository.find();

      if (superAdminRole) {
        superAdminRole.userPrivileges = allPrivileges;
        await userRoleRepository.save(superAdminRole);
        this.logger.log('✅ Assigned all privileges to admin role.');
      } else {
        this.logger.warn('⚠️ Super Admin role not found.');
      }
    } catch (error) {
      this.logger.error('Failed to assign privileges to super admin role', error);
    }
  }
}
