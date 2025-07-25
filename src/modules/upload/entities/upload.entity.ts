import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UploadStatus } from '../../shared/shared.service';

@Entity('uploads')
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalUrl: string;

  @Column()
  filename: string;

  @Column({
    type: 'enum',
    enum: UploadStatus,
    default: UploadStatus.QUEUED,
  })
  status: UploadStatus;

  @Column({ nullable: true })
  googleDriveId: string;

  @Column({ nullable: true })
  googleDriveLink: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
