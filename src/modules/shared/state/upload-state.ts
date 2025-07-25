export interface UploadState {
  process(uploadId: string, url: string): Promise<void>;
  getStatus(): string;
}

export abstract class BaseUploadState implements UploadState {
  abstract process(uploadId: string, url: string): Promise<void>;
  abstract getStatus(): string;

  protected async transitionTo(
    uploadId: string,
    newState: UploadState,
    context: UploadStateContext,
  ): Promise<void> {
    context.setState(newState);
  }
}

export class QueuedState extends BaseUploadState {
  async process(uploadId: string, url: string): Promise<void> {
    console.log(`Upload ${uploadId} is queued for processing`);
  }

  getStatus(): string {
    return 'queued';
  }
}

export class DownloadingState extends BaseUploadState {
  constructor(
    private readonly sharedService: any,
    private readonly context: UploadStateContext,
  ) {
    super();
  }

  async process(uploadId: string, url: string): Promise<void> {
    try {
      console.log(`Downloading file for upload ${uploadId}`);
      const fileData = await this.sharedService.downloadFile(url);

      await this.transitionTo(
        uploadId,
        new UploadingState(this.sharedService, this.context),
        this.context,
      );

      await this.context.process(uploadId, url);
    } catch (error) {
      await this.transitionTo(
        uploadId,
        new FailedState(error.message),
        this.context,
      );
      throw error;
    }
  }

  getStatus(): string {
    return 'downloading';
  }
}

export class UploadingState extends BaseUploadState {
  constructor(
    private readonly sharedService: any,
    private readonly context: UploadStateContext,
  ) {
    super();
  }

  async process(uploadId: string, url: string): Promise<void> {
    try {
      console.log(`Uploading file to Google Drive for upload ${uploadId}`);

      await this.transitionTo(uploadId, new CompletedState(), this.context);
    } catch (error) {
      await this.transitionTo(
        uploadId,
        new FailedState(error.message),
        this.context,
      );
      throw error;
    }
  }

  getStatus(): string {
    return 'uploading';
  }
}

export class CompletedState extends BaseUploadState {
  async process(uploadId: string, url: string): Promise<void> {
    console.log(`Upload ${uploadId} completed successfully`);
  }

  getStatus(): string {
    return 'completed';
  }
}

export class FailedState extends BaseUploadState {
  constructor(private readonly errorMessage: string) {
    super();
  }

  async process(uploadId: string, url: string): Promise<void> {
    console.log(`Upload ${uploadId} failed: ${this.errorMessage}`);
  }

  getStatus(): string {
    return 'failed';
  }
}

export class UploadStateContext {
  private state: UploadState;

  constructor(
    private readonly sharedService: any,
    private readonly uploadService: any,
  ) {
    this.state = new QueuedState();
  }

  setState(state: UploadState): void {
    this.state = state;
  }

  getState(): UploadState {
    return this.state;
  }

  async process(uploadId: string, url: string): Promise<void> {
    await this.state.process(uploadId, url);
  }

  getStatus(): string {
    return this.state.getStatus();
  }
}
