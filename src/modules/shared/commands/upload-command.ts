export interface Command {
  execute(): Promise<void>;
}

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
}

export abstract class BaseCommand implements Command {
  abstract execute(): Promise<void>;

  protected async executeWithResult(): Promise<CommandResult> {
    try {
      await this.execute();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export class CreateUploadCommand extends BaseCommand {
  constructor(
    private readonly uploadService: any,
    private readonly urls: string[],
  ) {
    super();
  }

  async execute(): Promise<void> {
    await this.uploadService.createUploads({ urls: this.urls });
  }
}

export class ProcessUploadCommand extends BaseCommand {
  constructor(
    private readonly uploadService: any,
    private readonly driveService: any,
    private readonly sharedService: any,
    private readonly uploadId: string,
    private readonly url: string,
  ) {
    super();
  }

  async execute(): Promise<void> {
    await this.uploadService.updateStatus(this.uploadId, 'downloading');

    const { stream, filename, size } = await this.sharedService.downloadFile(
      this.url,
    );

    await this.uploadService.updateStatus(this.uploadId, 'uploading', {
      fileSize: size,
    });

    const mimeType = this.getMimeType(filename);
    const { id: googleDriveId, link: googleDriveLink } =
      await this.driveService.uploadFile(stream, filename, mimeType);

    await this.uploadService.updateStatus(this.uploadId, 'completed', {
      googleDriveId,
      googleDriveLink,
      fileSize: size,
    });
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

export class CommandInvoker {
  private commands: Command[] = [];

  addCommand(command: Command): void {
    this.commands.push(command);
  }

  async executeAll(): Promise<void> {
    for (const command of this.commands) {
      await command.execute();
    }
  }

  async executeCommand(command: Command): Promise<void> {
    await command.execute();
  }

  clear(): void {
    this.commands = [];
  }
}
